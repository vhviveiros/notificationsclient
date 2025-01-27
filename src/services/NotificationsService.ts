import notifee, {AndroidImportance, AndroidVisibility, AuthorizationStatus, EventType} from '@notifee/react-native';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';
import {observe} from 'mobx';
import ConnectionService from './ConnectionService.ts';
import ForegroundService from './ForegroundService.ts';
import {inject, singleton} from 'tsyringe';
import {TYPES} from '../../tsyringe.types.ts';

@singleton()
export default class NotificationsService extends Service {
    serviceName: string = 'NotificationsService';
    private _persistentChannel!: string;

    constructor(
        @inject(TYPES.BatteryState) private _batteryState: BatteryState,
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.ForegroundService) private _foregroundService: ForegroundService
    ) {
        super();
    }

    init() {
        this.registerForegroundService().then(_ => {
            this.isRunning = true;
            console.log(`${this.serviceName} has started.`);
        });
    }

    async requestPermission() {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    async registerBackgroundEvents() {
        notifee.onBackgroundEvent(async ({type, detail}) => {
            const events: Record<string, () => void> = {
                'suspend': () => this._connectionService.suspendServer(),
                'awake': () => this._connectionService.awakeServer(),
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
        await this.displayPersistentNotification();
        const runnable = this._foregroundService.runnable;
        notifee.registerForegroundService(() => {
            return new Promise(async () => {
                await this.registerBackgroundEvents();
                await runnable();
            });
        });
        this.watchStateChanges();
    }


    watchStateChanges() {
        const batteryState = this._batteryState;
        const connectionService = this._connectionService;

        this.disposerList.push(
            observe(connectionService, () => {
                this.displayPersistentNotification();
                if (!connectionService.isConnected) {
                    this.displayAlertNotification('Disconnected from server.');
                }
            }, false)
        );

        this.disposerList.push(
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

        // const batteryState = this._batteryState;
        const isConnected = this._connectionService.isConnected;
        const batteryInfo = {
            batteryLevel: this._batteryState.batteryLevel,
            isCharging: this._batteryState.isCharging,
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
        this._foregroundService.stop();
        this._connectionService.stop();
        super.stop();
    }
}
