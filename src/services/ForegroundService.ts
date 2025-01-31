import { observe } from 'mobx';
import Service from './Service.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';
import { inject, singleton } from 'tsyringe';
import { TYPES } from '../../tsyringe.types.ts';
import MobxBaseState from '../state/MobxBaseState.ts';
import { TypeSafeStateRegistry } from '../etc/typeSafeRegistry.ts';

@singleton()
export default class ForegroundService extends Service {
    private _stateRegistry: TypeSafeStateRegistry;
    private _runnableResolve?: () => void;

    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.BatteryState) batteryState: BatteryState,
    ) {
        super(TYPES.ForegroundService);
        this._stateRegistry = new TypeSafeStateRegistry();
        this._stateRegistry.set(TYPES.BatteryState, batteryState);
    }

    init() {
        if (this._connectionService.latestMessage) {
            this._onMessage(this._connectionService.latestMessage);
        }

        this.disposalCallbacks.push(observe(this._connectionService, 'latestMessage', (newMessage) => {
            this._onMessage(newMessage.newValue);
        }, true));
    }

    runnable() {
        return new Promise<void>((resolve) => {
            this._runnableResolve = resolve;
        });
    }

    private _onMessage(message: string) {
        console.log('ForegroundService: Received message:', message);
        if (!message) {
            return;
        }

        const onConnMessage = (data?: Record<string, { serviceName: string; serviceState: any; }>) => {
            if (!data) return;
            console.log(`Found connMessage: ${JSON.stringify(data)}`);
            try {
                const services = JSON.parse(message).connMessage as Array<{
                    serviceName: string;
                    serviceState: MobxBaseState;
                }>;

                console.log(`Services: ${JSON.stringify(services)}`);

                services.forEach((service) => {
                    this._stateRegistry.get(Symbol.for(service.serviceName))?.setState(service.serviceState);
                });
            } catch (e) {
                console.error(e);
            }
        };

        const onServiceUpdate = (data?: { serviceName: string; newState: any; }) => {
            if (!data) return;
            console.log(`Found serviceUpdate: ${JSON.stringify(data)}`);
            this._stateRegistry.get(Symbol.for(data.serviceName))?.setState(data.newState);
        };

        try {
            //Currently, there's two possibilities:
            // {serviceUpdate:{identifier, newState}}
            // {connMessage:{{identifier, serviceState}, {identifier, serviceState}, ...}}
            const data = JSON.parse(message);
            onServiceUpdate(data?.serviceUpdate);
            onConnMessage(data?.connMessage);
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error('ForegroundService: Invalid message:', message);
            }
        }
    }

    stop() {
        this._runnableResolve?.();
        this._runnableResolve = undefined;
        console.log(`Is there a resolve? ${this._runnableResolve ? 'Yes' : 'No'}`);
        super.stop();
    }
}
