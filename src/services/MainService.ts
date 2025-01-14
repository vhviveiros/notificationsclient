import ConnectionService, {DEFAULT_PORT, DEFAULT_URL} from './ConnectionService.ts';
import NotificationsService from './NotificationsService.ts';
import ForegroundService from './ForegroundService.ts';
import {observe} from 'mobx';
import Service from './Service.ts';

export default class MainService extends Service {
    serviceName: string = 'MainService';
    private static _instance: MainService;
    services: Service[] = [];

    private constructor() {
        super();
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new MainService();
        }
        return this._instance;
    }

    init() {
        this._initServices();
        super.init();
    }

    private _initServices() {
        const connectionService = ConnectionService.instance;
        const notificationsService = NotificationsService.instance;
        const foregroundService = ForegroundService.instance;

        this.services.push(connectionService, notificationsService, foregroundService);
        this.services.forEach(service => service.init())

        if (__DEV__) {
            this.disposerList.push(observe(connectionService, 'latestMessage', (change) => {
                console.log('Received message from persistent:', change.newValue);
            }));
        }
    }

    stop() {
        this.services.forEach(service => service.stop());
        super.stop();
    }
}
