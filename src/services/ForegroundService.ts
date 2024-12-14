import {observe} from 'mobx';
import Service from './Service.ts';
import NotificationsService from './NotificationsService.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';

export default class ForegroundService extends Service {
    private static counter: number = 0;
    private static _instance: ForegroundService;

    private constructor() {
        super();
        ForegroundService.counter++;
        console.log(`ForegroundService instance created: ${ForegroundService.counter}`);
    }

    static get instance() {
        if (!this._instance) {
            console.log('Creating new ForegroundService instance');
            this._instance = new ForegroundService();
        } else {
            console.log('Using existing ForegroundService instance');
        }
        return this._instance;
    }

    init() {
        console.log('Registering foreground service');
        NotificationsService.instance.registerForegroundService(this._runnable);
    }

    private _runnable = () => {
        return new Promise<void>(_ => {
            observe(ConnectionService.instance, 'latestMessage', (newMessage) => {
                this._onMessage(newMessage.newValue);
            });
        });
    };

    private _onMessage(message: string) {
        console.log('ForegroundService: Received message:', message);
        const data = JSON.parse(message);
        if (data.serviceName === BatteryState.instance.serviceName) {
            BatteryState.instance.setState(data.result.status);
        }
    }
}
