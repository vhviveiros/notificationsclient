import {action, observe, when} from 'mobx';
import Service from './Service.ts';
import NotificationsService from './NotificationsService.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';

export default class ForegroundService extends Service {
    serviceName: string = 'ForegroundService';
    private static _instance: ForegroundService;

    private constructor() {
        super();
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
        this.disposerList.push(observe(ConnectionService.instance, 'latestMessage', (newMessage) => {
            this._onMessage(newMessage.newValue);
        }, true));
        NotificationsService.instance.registerForegroundService(this._runnable);
        super.init();
    }

    @action
    private _runnable() {
        return new Promise<void>((_, reject) => {
            when(() => !ForegroundService.instance.isRunning, () => {
                reject();
            });
            this.isRunning = true;
        });
    }

    private _onMessage(message: string) {
        console.log('ForegroundService: Received message:', message);
        if (!message) {
            return;
        }
        try {
            const data = JSON.parse(message);
            if (data.serviceName === BatteryState.instance.serviceName) {
                BatteryState.instance.setState(data.result.status);
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error('ForegroundService: Invalid message:', message);
            }
        }
    }
}
