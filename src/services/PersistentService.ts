import ConnectionService, {DEFAULT_PORT, DEFAULT_URL} from './ConnectionService.ts';
import NotificationsService from './NotificationsService.ts';
import ForegroundService from './ForegroundService.ts';
import {observe} from 'mobx';
import Service from './Service.ts';
import BatteryState from '../state/BatteryState.ts';

export default class PersistentService extends Service {
    private static _instance: PersistentService;
    //Services
    connectionService!: ConnectionService;
    notificationsService!: NotificationsService;
    foregroundService!: ForegroundService;
    //States
    batteryState!: BatteryState;

    private constructor() {
        super();
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new PersistentService();
        }
        return this._instance;
    }

    init() {
        this._initStates();
        this._initServices();
    }

    private _initServices() {
        this.connectionService = ConnectionService.instance;
        this.notificationsService = NotificationsService.instance;
        this.foregroundService = ForegroundService.instance;

        this.foregroundService.init();
        this.connectionService.init(DEFAULT_URL, DEFAULT_PORT);

        observe(this.connectionService, 'latestMessage', (change) => {
            console.log('Received message from persistent:', change.newValue);
        });
    }

    private _initStates() {
        this.batteryState = BatteryState.instance;
    }
}
