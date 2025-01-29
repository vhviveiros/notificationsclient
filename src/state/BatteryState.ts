import MobxState from './MobxState.ts';
import MobxBaseState from './MobxBaseState.ts';
import {makeAutoObservable} from 'mobx';
import {singleton} from 'tsyringe';
import {TYPES} from '../../tsyringe.types.ts';

export interface BatteryInfo extends MobxBaseState {
    batteryLevel: number;
    isCharging: boolean;
    chargingState: string;
}

@singleton()
export default class BatteryState implements MobxState, BatteryInfo {
    readonly identifier: Symbol = TYPES.BatteryState;
    batteryLevel: number;
    isCharging: boolean;
    chargingState: string;

    constructor() {
        this.batteryLevel = -1;
        this.isCharging = false;
        this.chargingState = 'unknown';
        makeAutoObservable(this);
    }

    setState(batteryInfo: BatteryInfo) {
        this.batteryLevel = batteryInfo.batteryLevel;
        this.isCharging = batteryInfo.isCharging;
        this.chargingState = batteryInfo.chargingState;
        console.log(`Changed battery state to ${JSON.stringify(batteryInfo)}`);
    }

    hasInit = () => this.batteryLevel !== -1 && this.chargingState !== 'unknown';
}
