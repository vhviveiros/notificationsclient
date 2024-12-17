import notifee, {AndroidImportance, AuthorizationStatus, AndroidVisibility, EventType} from '@notifee/react-native';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';
import {observe} from 'mobx';
import ConnectionService from './ConnectionService.ts';

export default class NotificationsService extends Service {
    private static _instance: NotificationsService;
    private _persistentChannel!: string;

    private constructor() {
        super();
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new NotificationsService();
        }
        return this._instance;
    }

    init() {
    }

    async requestPermission() {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    async registerForegroundService(runnable: () => Promise<void>) {
        await this.displayPersistentNotification();
        notifee.registerForegroundService(() => {
            return new Promise(async () => {
                notifee.onBackgroundEvent(async ({type, detail}) => {
                    const events: Record<string, () => void> = {
                        'suspend': () => ConnectionService.instance.suspendServer(),
                        'awake': () => ConnectionService.instance.awakeServer(),
                    };

                    if (type === EventType.ACTION_PRESS) {
                        const id: string = detail.pressAction!.id.toString();
                        events[id]();
                    }
                });
                await runnable();
            });
        });
        this.watchStateChanges();
    }


    watchStateChanges() {
        const batteryState = BatteryState.instance;
        const connectionService = ConnectionService.instance;

        observe(connectionService, () => {
            this.displayPersistentNotification();
        });

        observe(batteryState, () => {
            this.displayPersistentNotification();
        });
    }

    async displayPersistentNotification() {
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

        // const batteryState = BatteryState.instance;
        const connectionService = ConnectionService.instance;

        const isConnected = connectionService.isConnected;
        const batteryInfo = {
            batteryLevel: BatteryState.instance.batteryLevel,
            isCharging: BatteryState.instance.isCharging,
        };

        const title = 'Server Status';
        const conn = isConnected ? 'Connected' : 'Disconnected';
        const isCharging = batteryInfo.isCharging ? 'Charging' : 'Discharging';
        // console.log('Battery Info:', batteryInfo);
        const body = `Server ${conn}<br>Battery: ${batteryInfo.batteryLevel}% | ${isCharging}`;

        return displayNotification(title, body);
    }
}
