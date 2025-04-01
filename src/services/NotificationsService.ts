import notifee, { AndroidImportance, AndroidVisibility, AuthorizationStatus, Event, EventType } from '@notifee/react-native';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';
import { observe } from 'mobx';
import ConnectionService from './ConnectionService.ts';
import ForegroundService from './ForegroundService.ts';
import { inject, singleton } from 'tsyringe';
import { TYPES } from '../../tsyringe.types.ts';
import { TypeSafeServiceRegistry, TypeSafeStateRegistry } from '../etc/typeSafeRegistry.ts';
import { Linking } from 'react-native';
import { TimerManager } from '../etc/TimerManager.ts';
import WebSiteMonitorState from '../state/WebSiteMonitorState.ts';

@singleton()
export default class NotificationsService extends Service {
    private readonly DEFAULT_TIMER_INCREMENT = 5;
    private readonly PENDING_SUSPEND_TIMEOUT_MINUTES = 10; // 5 minutes timeout
    private readonly SUSPEND_TIMER_INCREMENT_UPGRADE = 3;

    private _persistentChannel!: string;
    private _stateRegistry: TypeSafeStateRegistry;
    private _serviceRegistry: TypeSafeServiceRegistry;
    private _notificationActions: Record<string, string>;
    private _timerManager: TimerManager | null = null;
    private _suspendTimerTime: number = 0;
    private _timerStateListeners: Array<() => void> = [];
    private _pendingSuspendCommand: boolean = false;
    private _pendingSuspendTimeout: NodeJS.Timeout | null = null;

    constructor(
        @inject(TYPES.BatteryState) batteryState: BatteryState,
        @inject(TYPES.ConnectionService) connectionService: ConnectionService,
        @inject(TYPES.ForegroundService) foregroundService: ForegroundService,
        @inject(TYPES.WebSiteMonitorState) websiteMonitorState: WebSiteMonitorState
    ) {
        super(TYPES.NotificationsService);
        this._notificationActions = {
            'Suspend': 'suspend',
            'Awake': 'awake',
            'Dismiss': 'dismiss',
        };
        this._serviceRegistry = new TypeSafeServiceRegistry();
        this._stateRegistry = new TypeSafeStateRegistry();
        this._stateRegistry.set(TYPES.BatteryState, batteryState);
        this._serviceRegistry.set(TYPES.ConnectionService, connectionService);
        this._serviceRegistry.set(TYPES.ForegroundService, foregroundService);
    }

    // Add a method to register timer state listeners
    addTimerStateListener(listener: () => void): () => void {
        this._timerStateListeners.push(listener);
        return () => {
            const index = this._timerStateListeners.indexOf(listener);
            if (index !== -1) {
                this._timerStateListeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners when timer state changes
    private _notifyTimerStateListeners() {
        this._timerStateListeners.forEach(listener => listener());
    }

    init() {
        console.log('NotificationService: Initializing...');
        notifee.onForegroundEvent(this.handleEvents.bind(this));
        notifee.onBackgroundEvent(this.handleEvents.bind(this));
        this.registerForegroundService();
    }

    async requestPermission() {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    private _updateSuspendNotificationActions = () => {
        this._suspendTimerTime = this._timerManager?.getRemainingMinutes() ?? 0;

        const oldSuspendKey = Object.keys(this._notificationActions)[0];

        // Determine the suspend action text based on timer state
        let suspendKey = 'Suspend';
        if (this._timerManager?.isRunning()) {
            // If timer is running, check if we should show the reset increment or current increment
            let incrementValue;
            if (this._timerManager.shouldResetIncrement()) {
                // If we should reset, show the default increment
                incrementValue = `+${this.DEFAULT_TIMER_INCREMENT}m`;
            } else {
                // Otherwise show the current increment
                incrementValue = `+${this._timerManager.currentIncrement}m`;
            }
            suspendKey = `Suspend ${incrementValue}`;
        }

        // Create a new notification actions object
        const newNotificationActions: Record<string, string> = {};

        // Add the updated suspend key first
        newNotificationActions[suspendKey] = 'suspend';

        // Add all other keys except the old suspend key
        Object.keys(this._notificationActions).forEach(key => {
            if (key !== oldSuspendKey) {
                newNotificationActions[key] = this._notificationActions[key];
            }
        });

        this._notificationActions = newNotificationActions;

        console.log(`oldSuspendKey: ${oldSuspendKey} suspendKey: ${suspendKey}`);
        this.displayPersistentNotification();
        this._notifyTimerStateListeners();
    };

    async handleEvents({ type, detail }: Event) {
        const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
        const events: Record<string, () => void> = {
            'suspend': () => {
                console.log('NotificationService: Suspend pressed');

                if (!this._timerManager) {
                    // Create timer manager if it doesn't exist
                    this._timerManager = new TimerManager({
                        initialIncrement: this.DEFAULT_TIMER_INCREMENT,
                        incrementTickUpgrade: this.SUSPEND_TIMER_INCREMENT_UPGRADE,
                        onStateChange: this._updateSuspendNotificationActions,
                        onComplete: () => {
                            if (connectionService.isConnected) {
                                // If connected, suspend immediately
                                connectionService.suspendServer();
                            } else {
                                // If disconnected, queue the suspend command
                                this._queueSuspendCommand();
                            }
                        }
                    });
                }

                // Add time or start the timer
                this._timerManager.addTime();
            },
            'awake': () => {
                console.log('NotificationService: Awake pressed');
                connectionService.awakeServer();
            },
            'dismiss': async () => {
                console.log('NotificationService: Dismiss pressed');
                this.stop();
            },
        };

        if (type === EventType.ACTION_PRESS) {
            const id: string = detail.pressAction!.id.toString();
            events[id]();
        } else if (type === EventType.PRESS) {
            Linking.openURL('app://open');
        }
    }

    async registerForegroundService() {
        console.log('NotificationService: Registering foreground service...');
        const foregroundService = this._serviceRegistry.get<ForegroundService>(TYPES.ForegroundService);
        notifee.registerForegroundService(async () => {
            console.log('NotificationService: Starting foreground service...');
            try {
                await foregroundService.runnable();
            } finally {
                console.log('NotificationService: Stopped foreground service');
                await notifee.stopForegroundService();
            }
        });
        await this.displayPersistentNotification();
        this.watchStateChanges();
    }

    watchStateChanges() {
        const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
        const batteryState = this._stateRegistry.get<BatteryState>(TYPES.BatteryState);
        const websiteMonitorState = this._stateRegistry.get<WebSiteMonitorState>(TYPES.WebSiteMonitorState);
        console.log('NotificationService: Watching state changes...');
        this.disposalCallbacks.push(
            observe(connectionService, 'isConnected', (change) => {
                this.displayPersistentNotification();

                if (change.newValue === true && this._pendingSuspendCommand) {
                    console.log('NotificationService: Connection restored, executing pending suspend command');
                    this._pendingSuspendCommand = false;

                    if (this._pendingSuspendTimeout) {
                        clearTimeout(this._pendingSuspendTimeout);
                        this._pendingSuspendTimeout = null;
                    }

                    connectionService.suspendServer();
                    this.displayAlertNotification('Connection restored. Server suspended as scheduled.');
                } else if (!connectionService.isConnected) {
                    this.displayAlertNotification('Disconnected from server.');
                }
            }, false)
        );

        this.disposalCallbacks.push(
            observe(batteryState, (change) => {
                this.displayPersistentNotification();
                if (change.type === 'update' &&
                    change.name === 'isCharging' &&
                    change.oldValue === true &&
                    batteryState.hasInit()) {
                    this.displayAlertNotification('Battery is discharging.');
                }
            }, false)
        );

        this.disposalCallbacks.push(observe(websiteMonitorState, 'sites', (change) => {
            // Only process if we have both old and new values to compare
            if (change.oldValue && change.newValue) {
                // Compare each site in the new value with its old state
                Object.entries(change.newValue).forEach(([url, newSite]) => {
                    const oldSite = change.oldValue ? change.oldValue[url] : null;

                    // Only notify if the site existed before and its state changed
                    if (oldSite && oldSite.isUp !== newSite.isUp) {
                        this.displayAlertNotification(`Website ${newSite.name} is ${newSite.isUp ? 'online' : 'offline'}.`);
                    }
                    // For new sites that didn't exist before, we could add a different notification here
                });
            }
        }));
    }

    async displayAlertNotification(body: string) {
        if (!(await this.requestPermission())) {
            return;
        }

        const importance = AndroidImportance.HIGH;
        const channelId = 'alert-notifee';

        await notifee.createChannel({
            id: channelId,
            name: 'Alert Notification',
            importance: importance,
            visibility: AndroidVisibility.PUBLIC,
            lights: true,
        });

        const displayNotification = () => notifee.displayNotification({
            id: channelId,
            body: body,
            android: {
                channelId: channelId,
                importance: importance,
                pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                },
            },
        });

        return displayNotification();
    }

    async displayPersistentNotification() {
        console.log('Displaying persistent notification...');
        if (!(await this.requestPermission())) {
            return;
        }

        const importance = AndroidImportance.MIN;
        const channelId = 'perm-notifee';
        const displayNotification = (title: string, body: string) => notifee.displayNotification({
            id: channelId,
            title: title,
            body: body,
            android: {
                autoCancel: false,
                channelId: channelId,
                importance: importance,
                ongoing: true,
                asForegroundService: true,
                pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                },
                actions: [
                    ...Object.keys(this._notificationActions).map(key => ({
                        title: key,
                        pressAction: {
                            id: this._notificationActions[key],
                        },
                    })),
                ],
            },
        });

        if (!this._persistentChannel) {
            this._persistentChannel = await notifee.createChannel({
                id: channelId,
                name: 'Persistent Notification',
                importance: importance,
                visibility: AndroidVisibility.PUBLIC,
                lights: true,
            });
        }

        const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
        const batteryState = this._stateRegistry.get<BatteryState>(TYPES.BatteryState);
        const isConnected = connectionService.isConnected;

        // Build the title with sleep timer info if active
        const conn = isConnected ? 'Connected' : 'Disconnected';
        let title = `Server ${conn}`;

        // Add sleep timer info to title if timer is running
        if (this._suspendTimerTime > 0) {
            title += ` | Sleep in ${this._suspendTimerTime}m`;
        }

        const isCharging = batteryState.isCharging ? 'Charging' : 'Discharging';
        const body = `Battery: ${batteryState.batteryLevel}% | ${isCharging}`;

        return displayNotification(title, body);
    }

    stop() {
        if (this._pendingSuspendTimeout) {
            clearTimeout(this._pendingSuspendTimeout);
            this._pendingSuspendTimeout = null;
        }
        this._pendingSuspendCommand = false;

        this._serviceRegistry.forEach(service => service.stop());
        super.stop();
    }

    get suspendTimerRunning(): boolean {
        return this._timerManager?.isRunning() ?? false;
    }

    get suspendTimerMinutes(): number {
        return this._suspendTimerTime;
    }

    cancelSuspendTimer(): void {
        if (this._timerManager) {
            this._timerManager.cancel();
            this._timerManager = null;
        }
    }

    private _queueSuspendCommand(): void {
        console.log('NotificationService: Queuing suspend command due to disconnection');
        this._pendingSuspendCommand = true;

        this._pendingSuspendTimeout = setTimeout(() => {
            if (this._pendingSuspendCommand) {
                console.log(`NotificationService: Canceling pending suspend command after ${this.PENDING_SUSPEND_TIMEOUT_MINUTES} minutes`);
                this._pendingSuspendCommand = false;
                this._pendingSuspendTimeout = null;
                this.displayAlertNotification('Server suspend command canceled due to prolonged disconnection.');
            }
        }, this.PENDING_SUSPEND_TIMEOUT_MINUTES * 60 * 1000);

        this.displayAlertNotification('Server will be suspended when connection is restored.');
    }
}
