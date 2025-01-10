import notifee, {AndroidImportance, AuthorizationStatus, AndroidVisibility, EventType} from '@notifee/react-native';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';
import {observe} from 'mobx';
import ConnectionService from './ConnectionService.ts';
import ForegroundService from './ForegroundService.ts';

export default class NotificationsService extends Service {
    serviceName: string = 'NotificationsService';
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

    async requestPermission() {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    async registerBackgroundEvents() {
        notifee.onBackgroundEvent(async ({type, detail}) => {
            const events: Record<string, () => void> = {
                'suspend': () => ConnectionService.instance.suspendServer(),
                'awake': () => ConnectionService.instance.awakeServer(),
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

    async registerForegroundService(runnable: () => Promise<void>) {
        await this.displayPersistentNotification();
        notifee.registerForegroundService(() => {
            return new Promise(async () => {
                await this.registerBackgroundEvents();
                await runnable();
            });
        });
        this.watchStateChanges();
    }


    watchStateChanges() {
        const batteryState = BatteryState.instance;
        const connectionService = ConnectionService.instance;

        this.disposerList.push(
            observe(connectionService, () => {
                this.displayPersistentNotification();
                if (!connectionService.isConnected) {
                    this.displayAlertNotification('Disconnected from server.');
                }
            })
        );

        this.disposerList.push(
            observe(batteryState, () => {
                this.displayPersistentNotification();
                if (!batteryState.isCharging) {
                    this.displayAlertNotification('Battery is discharging.');
                }
            })
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

    stop() {
        notifee.cancelAllNotifications();
        notifee.stopForegroundService();
        ForegroundService.instance.stop();
        ConnectionService.instance.stop();
        super.stop();
    }
}
