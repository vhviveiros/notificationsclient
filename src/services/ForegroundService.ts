import { observe } from 'mobx';
import Service from './Service.ts';
import ConnectionService from './ConnectionService.ts';
import BatteryState from '../state/BatteryState.ts';
import { inject, singleton } from 'tsyringe';
import { TYPES } from '../../tsyringe.types.ts';
import MobxBaseState from '../state/MobxBaseState.ts';
import { TypeSafeStateRegistry } from '../etc/typeSafeRegistry.ts';
import WebSiteMonitorState from '../state/WebSiteMonitorState.ts';

/**
 * Service that manages foreground operations and state synchronization.
 * Handles message processing and state updates while running in the foreground.
 */
@singleton()
export default class ForegroundService extends Service {
    /** Registry to store and manage application states */
    private _stateRegistry: TypeSafeStateRegistry;
    /** Resolver function for the runnable promise */
    private _runnableResolve?: () => void;

    /**
     * Creates a new ForegroundService instance.
     * @param _connectionService - Service handling connection state and messages
     * @param batteryState - State managing battery information
     */
    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.BatteryState) batteryState: BatteryState,
        @inject(TYPES.WebSiteMonitorState) webSiteMonitorState: WebSiteMonitorState,
    ) {
        super(TYPES.ForegroundService);
        this._stateRegistry = new TypeSafeStateRegistry();
        this._stateRegistry.set(TYPES.BatteryState, batteryState);
        this._stateRegistry.set(TYPES.WebSiteMonitorState, webSiteMonitorState);
    }


    /**
     * Initializes the service by setting up message observers.
     * Processes any existing messages and starts watching for new ones.
     */
    init() {
        if (this._connectionService.latestMessage) {
            this._onMessage(this._connectionService.latestMessage);
        }

        this.disposalCallbacks.push(observe(this._connectionService, 'latestMessage', (newMessage) => {
            this._onMessage(newMessage.newValue);
        }, true));
    }

    /**
     * Creates a promise that resolves when the service should stop running.
     * Used to keep the service active in the foreground.
     * @returns Promise that resolves when the service should stop
     */
    runnable() {
        return new Promise<void>((resolve) => {
            this._runnableResolve = resolve;
        });
    }

    /**
     * Handles incoming messages and updates relevant states.
     * @param message - JSON string containing state updates or connection messages
     */
    private _onMessage(message: string) {
        console.log('ForegroundService: Received message:', message);
        if (!message) {
            return;
        }

        /**
         * Processes connection messages containing multiple service states
         * @param data - Object containing service states for multiple services
         */
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
                    const stateName = Symbol.for(service.serviceName).description!.replace('Service', 'State');
                    this._stateRegistry.get(Symbol.for(stateName))?.setState(service.serviceState);
                });
            } catch (e) {
                console.error(e);
            }
        };

        /**
         * Processes single service state updates
         * @param data - Object containing the service name and new state
         */
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

    /**
     * Stops the foreground service and cleans up resources.
     * Resolves the runnable promise and calls the parent stop method.
     */
    stop() {
        this._runnableResolve?.();
        this._runnableResolve = undefined;
        console.log(`Is there a resolve? ${this._runnableResolve ? 'Yes' : 'No'}`);
        super.stop();
    }
}
