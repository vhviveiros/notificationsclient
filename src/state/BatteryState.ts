import MobxState from './MobxState.ts';
import MobxBaseState from './MobxBaseState.ts';
import {makeAutoObservable} from 'mobx';
import ConnectionService from '../services/ConnectionService.ts';

export interface BatteryInfo extends MobxBaseState {
    batteryLevel: number;
    isCharging: boolean;
    chargingState: string;
}

export default class BatteryState implements MobxState {
    private static _instance: BatteryState;
    readonly serviceName: string = 'BatteryService';
    batteryLevel: number;
    isCharging: boolean;
    chargingState: string;

    private constructor() {
        const lastMessage = ConnectionService.instance?.latestMessage;
        console.log('BatteryState: Last message:', lastMessage);
        if (lastMessage) {
            const batteryInfo = JSON.parse(lastMessage).result.status;
            this.batteryLevel = batteryInfo.percentage;
            this.isCharging = batteryInfo.isDischarging === false;
            this.chargingState = batteryInfo.status;
        } else {
            this.batteryLevel = 0;
            this.isCharging = false;
            this.chargingState = 'unknown';
        }
        makeAutoObservable(this);
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new BatteryState();
        }
        return this._instance;
    }

    setState(batteryInfo: BatteryInfo) {
        this.batteryLevel = batteryInfo.batteryLevel;
        this.isCharging = batteryInfo.isCharging;
        this.chargingState = batteryInfo.chargingState;
    }
}
