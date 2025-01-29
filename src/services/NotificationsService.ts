import notifee, {AndroidImportance, AndroidVisibility, AuthorizationStatus, EventType} from '@notifee/react-native';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';
import {observe} from 'mobx';
import ConnectionService from './ConnectionService.ts';
import ForegroundService from './ForegroundService.ts';
import {inject, singleton} from 'tsyringe';
import {TYPES} from '../../tsyringe.types.ts';
import {TypeSafeServiceRegistry, TypeSafeStateRegistry} from '../etc/typeSafeRegistry.ts';

@singleton()
export default class NotificationsService extends Service {
    private _persistentChannel!: string;
    private _stateRegistry: TypeSafeStateRegistry;
    private _serviceRegistry: TypeSafeServiceRegistry;

    constructor(
        @inject(TYPES.BatteryState) batteryState: BatteryState,
        @inject(TYPES.ConnectionService) connectionService: ConnectionService,
        @inject(TYPES.ForegroundService) foregroundService: ForegroundService
    ) {
        super(TYPES.NotificationsService);
        this._serviceRegistry = new TypeSafeServiceRegistry();
        this._stateRegistry = new TypeSafeStateRegistry();
        this._stateRegistry.set(TYPES.BatteryState, batteryState);
        this._serviceRegistry.set(TYPES.ConnectionService, connectionService);
        this._serviceRegistry.set(TYPES.ForegroundService, foregroundService);
    }

    init() {
        this.registerForegroundService();
    }

    async requestPermission() {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    async registerBackgroundEvents() {
        console.log('NotificationService: Registering background events...');
        notifee.onBackgroundEvent(async ({type, detail}) => {
            const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
            const events: Record<string, () => void> = {
                'suspend': () => connectionService.suspendServer(),
                'awake': () => connectionService.awakeServer(),
                'dismiss': async () => {
                    console.log('Dismiss pressed');
                    this.stop();
                },
            };

            if (type === EventType.ACTION_PRESS) {
                const id: string = detail.pressAction!.id.toString();
                events[id]();
            }
        });
    }

    async registerForegroundService() {
        console.log('NotificationService: Registering foreground service...');
        const foregroundService = this._serviceRegistry.get<ForegroundService>(TYPES.ForegroundService);
        const runnable = foregroundService.runnable;
        notifee.registerForegroundService(() => {
            return new Promise(async () => {
                console.log('NotificationService: Starting foreground service...');
                await this.registerBackgroundEvents();
                await runnable();
            });
        });
        await this.displayPersistentNotification();
        this.watchStateChanges();
    }


    watchStateChanges() {
        const connectionService = this._serviceRegistry.get<ConnectionService>(TYPES.ConnectionService);
        const batteryState = this._stateRegistry.get<BatteryState>(TYPES.BatteryState);

        console.log('NotificationService: Watching state changes...');
        this.disposalCallbacks.push(
            observe(connectionService, () => {
                this.displayPersistentNotification();
                if (!connectionService.isConnected) {
                    this.displayAlertNotification('Disconnected from server.');
                }
            }, false)
        );

        this.disposalCallbacks.push(
            observe(batteryState, () => {
                this.displayPersistentNotification();
                if (batteryState.hasInit() && !batteryState.isCharging) {
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
                actions: [
                    {
                        title: 'Suspend',
                        pressAction: {
                            id: 'suspend',
                        },
                    },
                    {
                        title: 'Awake',
                        pressAction: {
                            id: 'awake',
                        },
                    },
                    {
                        title: 'Dismiss',
                        pressAction: {
                            id: 'dismiss',
                        },
                    },
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
        const batteryInfo = {
            batteryLevel: batteryState.batteryLevel,
            isCharging: batteryState.isCharging,
        };

        const title = 'Server Status';
        const conn = isConnected ? 'Connected' : 'Disconnected';
        const isCharging = batteryInfo.isCharging ? 'Charging' : 'Discharging';
        // console.log('Battery Info:', batteryInfo);
        const body = `Server ${conn}<br>Battery: ${batteryInfo.batteryLevel}% | ${isCharging}`;

        return displayNotification(title, body);
    }

    stop() {
        notifee.cancelAllNotifications();
        notifee.stopForegroundService();
        this._serviceRegistry.forEach(service => service.stop());
        super.stop();
    }
}
