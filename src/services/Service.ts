import {action, makeObservable, observable} from 'mobx';

abstract class Service {
    serviceName: string;
    disposerList: (() => void)[] = [];
    isRunning: boolean = false;

    protected constructor(serviceName: string) {
        this.serviceName = serviceName;
        console.log(`Initializing ${this.serviceName}...`);
        makeObservable(this, {
            isRunning: observable,
            stop: action,
        });
        // Defer init() to ensure child class dependencies are injected first
        queueMicrotask(async () => {
            await this.init();
            this.isRunning = true;
            console.log(`${this.serviceName} has started.`);
        });
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
