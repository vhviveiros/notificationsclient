import { action, makeObservable, observable } from 'mobx';

declare function queueMicrotask(callback: () => void): void;

/**
 * Abstract base class for services providing lifecycle management and observable state.
 * Subclasses should implement initialization logic in `init()` and cleanup in `stop()`.
 */
abstract class Service {
    /**
     * Unique identifier for the service, used for logging purposes.
     */
    readonly identifier: Symbol;

    /**
     * List of cleanup callbacks to execute when the service stops.
     */
    protected disposalCallbacks: Array<() => void> = [];

    /**
     * Observable flag indicating whether the service is currently running.
     */
    isRunning: boolean = false;

    /**
     * Constructs a new Service instance.
     * @param serviceName - Identifier used in diagnostic messages
     * @protected - Only accessible by subclasses (abstract class pattern)
     */
    protected constructor(serviceName: Symbol) {
        this.identifier = serviceName;
        console.log(`Initializing ${this.identifier.description}...`);
        makeObservable(this, {
            isRunning: observable,
            stop: action,
        });
        // Defer initialization to ensure dependency injection completes
        queueMicrotask(() => {
            this.init();
            this.isRunning = true;
            console.log(`${this.identifier.description} has started.`);
        });
    }

    /**
     * Abstract initialization method must be implemented by subclasses.
     * Implement setup logic like event listeners or API calls here.
     */
    protected abstract init(): void;

    /**
     * Stops the service and executes all cleanup callbacks.
     * Can be extended by subclasses for additional cleanup logic.
     * @param _args - Optional parameters for subclass implementations
     */
    stop(..._args: unknown[]): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        // Execute all cleanup callbacks
        this.disposalCallbacks.forEach(disposal => disposal());
        this.disposalCallbacks = [];
        console.log(`${this.identifier.description} has stopped.`);
    }
}

export default Service;
