import 'reflect-metadata';
import {observe, when} from 'mobx';
import Service from './Service.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';
import {inject, singleton} from 'tsyringe';
import {TYPES} from '../../tsyringe.types.ts';
import MobxBaseState from '../state/MobxBaseState.ts';
import MobxState from '../state/MobxState.ts';

@singleton()
export default class ForegroundService extends Service {
    private _stateRegistry: Map<string, MobxState>;

    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.BatteryState) batteryState: BatteryState,
    ) {
        super('ForegroundService');
        this._stateRegistry = new Map<string, MobxState>();
        this._stateRegistry.set(batteryState.serviceName, batteryState);
    }

    init() {
        if (this._connectionService.latestMessage) {
            const batteryInfo = JSON.parse(this._connectionService.latestMessage).result.state;
            const batteryLevel = batteryInfo.percentage;
            const isCharging = batteryInfo.isDischarging === false;
            const chargingState = batteryInfo.state;

            this._stateRegistry.get(TYPES.BatteryState.description!)!.setState({
                batteryLevel,
                isCharging,
                chargingState,
            });
        }

        this.disposerList.push(observe(this._connectionService, 'latestMessage', (newMessage) => {
            this._onMessage(newMessage.newValue);
        }, true));
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
            console.log(`Found connMessage: ${JSON.stringify(data)}`);
            try {
                const services = JSON.parse(message).connMessage as Array<{
                    serviceName: string;
                    serviceState: MobxBaseState;
                }>;

                console.log(`Services: ${JSON.stringify(services)}`);

                services.forEach((service) => {
                    this._stateRegistry.get(service.serviceName)?.setState(service.serviceState);
                });
            } catch (e) {
                console.error(e);
            }
        };

        const onServiceUpdate = (data?: { serviceName: string; newState: any }) => {
            if (!data) return;
            console.log(`Found serviceUpdate: ${JSON.stringify(data)}`);
            this._stateRegistry.get(data.serviceName)?.setState(data.newState);
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
