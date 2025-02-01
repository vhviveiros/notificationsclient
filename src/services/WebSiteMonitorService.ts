import { inject, singleton } from 'tsyringe';
import Service from './Service';
import { TYPES } from '../../tsyringe.types';
import ConnectionService from './ConnectionService';
import { observe } from 'mobx';
import WebSiteMonitorState from '../state/WebSiteMonitorState';

@singleton()
export default class WebSiteMonitorService extends Service {
    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.WebSiteMonitorState) private _state: WebSiteMonitorState,
    ) {
        super(TYPES.WebSiteMonitorService);
    }

    init(): void {
        // Observe connection service messages
        this.disposalCallbacks.push(
            observe(this._connectionService, 'latestMessage', (change) => {
                this._handleMessage(change.newValue);
            })
        );

        // Process any existing message
        if (this._connectionService.latestMessage) {
            this._handleMessage(this._connectionService.latestMessage);
        }
    }

    private _handleMessage(message: string) {
        if (!message) return;

        try {
            const data = JSON.parse(message);

            // Check if this message is for our service
            if (data.serviceName === 'WebSiteMonitorService' && data.result) {
                this._state.setState(data.result);
            }
        } catch (error) {
            console.error('WebSiteMonitorService: Error parsing message:', error);
        }
    }
} 