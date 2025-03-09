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
import { createDynamicTimer } from '../etc/tools.ts';

@singleton()
export default class NotificationsService extends Service {
    private readonly DEFAULT_TIMER_INCREMENT = 5;

    private _persistentChannel!: string;
    private _stateRegistry: TypeSafeStateRegistry;
    private _serviceRegistry: TypeSafeServiceRegistry;
    private _notificationActions: Record<string, string>;
    private _suspendTimer: ReturnType<typeof createDynamicTimer> | null = null;
    private _suspendTimerIncrement: number = this.DEFAULT_TIMER_INCREMENT;
    private _suspendTimerIncrementTick: number = 0;
    private _suspendTimerIncrementTickUpgrade: number = 3;
    private _suspendTimerTime: number = 0;

    constructor(
        @inject(TYPES.BatteryState) batteryState: BatteryState,
        @inject(TYPES.ConnectionService) connectionService: ConnectionService,
        @inject(TYPES.ForegroundService) foregroundService: ForegroundService
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

    async handleEvents({ type, detail }: Event) {
        const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
        const events: Record<string, () => void> = {
            'suspend': () => {
                console.log('NotificationService: Suspend pressed');
                const updateNotification = () => {
                    this._suspendTimerTime = this._suspendTimer?.getRemainingMinutes() ?? 0;

                    const oldSuspendKey = Object.keys(this._notificationActions)[0];
                    const suspendValue = this._suspendTimerTime > 0 ? '' : ` (${this._suspendTimerTime}m)`;
                    const suspendKey = 'Suspend' + suspendValue;
                    const keys = Object.keys(this._notificationActions);
                    this._notificationActions = keys.reduce((acc, key) => {
                        if (key !== oldSuspendKey) {
                            acc[key] = this._notificationActions[key];
                        } else {
                            acc[suspendKey] = this._notificationActions[key];
                        }
                        return acc;
                    }, {} as Record<string, string>);
                    console.log(`oldSuspendKey: ${oldSuspendKey} suspendKey: ${suspendKey}`);
                    this.displayPersistentNotification();
                };

                if (this._suspendTimer?.isTimerRunning()) {
                    if (this._suspendTimerIncrementTick === this._suspendTimerIncrementTickUpgrade) {
                        this._suspendTimerIncrement *= 2;
                        this._suspendTimerIncrementTick = 0;
                    }
                    this._suspendTimerIncrementTick++;
                    this._suspendTimer.addMinutes(this._suspendTimerIncrement);
                    updateNotification();
                    return;
                }

                const onTimerTick = (minutes: number) => {
                    this._suspendTimerTime = minutes;
                    if (this._suspendTimerTime % 5 === 0) {
                        updateNotification();
                        this.displayPersistentNotification();
                    }
                    console.log(`NotificationService: Suspend timer tick: ${minutes}m`);
                };
                const onComplete = () => {
                    this._suspendTimer?.stop();
                    this._suspendTimer = null;
                    this._suspendTimerIncrement = this.DEFAULT_TIMER_INCREMENT;
                    this._suspendTimerIncrementTick = 0;
                    this._suspendTimerTime = 0;
                    connectionService.suspendServer();
                    updateNotification();
                };
                this._suspendTimer = createDynamicTimer(onComplete, onTimerTick);
                this._suspendTimer.start(this._suspendTimerIncrement);
                updateNotification();
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

        console.log('NotificationService: Watching state changes...');
        this.disposalCallbacks.push(
            observe(connectionService, 'isConnected', () => {
                this.displayPersistentNotification();
                if (!connectionService.isConnected) {
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

        const title = 'Server Status';
        const conn = isConnected ? 'Connected' : 'Disconnected';
        const isCharging = batteryState.isCharging ? 'Charging' : 'Discharging';
        // console.log('Battery Info:', batteryInfo);
        const body = `Server ${conn}<br>Battery: ${batteryState.batteryLevel}% | ${isCharging}`;

        return displayNotification(title, body);
    }

    stop() {
        this._serviceRegistry.forEach(service => service.stop());
        super.stop();
    }
}
