import {action, observable} from 'mobx';

export default abstract class Service {
    abstract serviceName: string;

    @observable
    accessor isRunning: boolean = false;
    disposerList: (() => void)[] = [];

    init(..._: any[]): void {
        console.log(`Initializing ${this.serviceName}`);
        this.isRunning = true;
    }

    @action
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
