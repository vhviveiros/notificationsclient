import { inject, singleton } from 'tsyringe';
import Service from './Service';
import { TYPES } from '../../tsyringe.types';
import ConnectionService from './ConnectionService';
import { observe } from 'mobx';
import WebSiteMonitorState from '../state/WebSiteMonitorState';
import NotificationsService from './NotificationsService';

@singleton()
export default class WebSiteMonitorService extends Service {
    constructor(
        @inject(TYPES.ConnectionService) private _connectionService: ConnectionService,
        @inject(TYPES.WebSiteMonitorState) private _state: WebSiteMonitorState,
        @inject(TYPES.NotificationsService) private _notificationsService: NotificationsService,
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

        // Watch for site status changes
        this.disposalCallbacks.push(
            observe(this._state, 'sites', (change) => {
                this._handleSiteStatusChanges(Object.values(change.newValue));
            })
        );
    }

    private _handleMessage(message: string) {
        if (!message) return;

        try {
            const data = JSON.parse(message);

            // Check if this message is for our service
            if (data.serviceName === 'WebSiteMonitorService' && data.result) {
                const oldSites = this._state.sites;
                this._state.setState(data.result);

                // Check for status changes immediately after state update
                this._handleSiteStatusChanges(Object.values(this._state.sites), Object.values(oldSites));
            }
        } catch (error) {
            console.error('WebSiteMonitorService: Error parsing message:', error);
        }
    }

    private _handleSiteStatusChanges(newSites: any[], oldSites?: any[]) {
        if (!oldSites) return;

        newSites.forEach(newSite => {
            const oldSite = oldSites.find(site => site.url === newSite.url);
            if (oldSite && oldSite.status === 'active' && newSite.status === 'inactive') {
                this._notificationsService.displayAlertNotification(
                    `Website ${newSite.url} is unavailable!`
                );
            }
        });
    }
}