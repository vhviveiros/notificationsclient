import {action, makeObservable, observable} from 'mobx';

abstract class Service {
    abstract serviceName: string;
    disposerList: (() => void)[] = [];
    isRunning: boolean = false;

    constructor() {
        makeObservable(this, {
            isRunning: observable,
            stop: action,
        });

        this.init();
    }

    abstract init(): void;

    stop(..._: any[]): void {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        this.disposerList.forEach(dispose => dispose());
        this.disposerList = [];
        console.log(`${this.serviceName} has stopped.`);
    }
}

export default Service;
