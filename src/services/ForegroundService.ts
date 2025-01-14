import {action, observe, when} from 'mobx';
import Service from './Service.ts';
import NotificationsService from './NotificationsService.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';
import MainService from './MainService.ts';

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

        const onConnMessage = (data?: Record<string, { serviceName: string; serviceState: any }>) => {
            if (!data) return;

            Object.values(data.connMessage).forEach((serviceState: any) => {
                if (serviceState.serviceName === BatteryState.instance.serviceName) {
                    BatteryState.instance.setState(serviceState.serviceState);
                }
            });
        };

        const onServiceUpdate = (data?: { serviceName: string; newState: any }) => {
            if (!data) return;

            if (data.serviceName === BatteryState.instance.serviceName) {
                BatteryState.instance.setState(data.newState);
            }
        };

        try {
            //Currently, there's two possibilities:
            // {serviceUpdate:{serviceName, newState}}
            // {connMessage:{{serviceName, serviceState}, {serviceName, serviceState}, ...}}
            const data = JSON.parse(message);
            onServiceUpdate(data?.serviceName);
            onConnMessage(data?.connMessage);
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error('ForegroundService: Invalid message:', message);
            }
        }
    }
}
