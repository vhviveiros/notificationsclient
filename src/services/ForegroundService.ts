import 'reflect-metadata';
import {observe, when} from 'mobx';
import Service from './Service.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';
import {inject, singleton} from 'tsyringe';
import {TYPES} from '../../tsyringe.types.ts';

@singleton()
export default class ForegroundService extends Service {
    serviceName: string = 'ForegroundService';

    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.BatteryState) private _batteryState: BatteryState,
    ) {
        super();
    }

    async init() {
        this.disposerList.push(observe(this._connectionService, 'latestMessage', (newMessage) => {
            this._onMessage(newMessage.newValue);
        }, true));
        this.isRunning = true;
        console.log(`${this.serviceName} has started.`);
    }

    runnable() {
        return new Promise<void>((_, reject) => {
            when(() => !this.isRunning, () => {
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
                if (serviceState.serviceName === this._batteryState.serviceName) {
                    this._batteryState.setState(serviceState.serviceState);
                }
            });
        };

        const onServiceUpdate = (data?: { serviceName: string; newState: any }) => {
            if (!data) return;

            if (data.serviceName === this._batteryState.serviceName) {
                this._batteryState.setState(data.newState);
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
