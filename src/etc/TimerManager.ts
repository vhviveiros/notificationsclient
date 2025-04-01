/**
 * Options for creating a TimerManager
 */
export interface TimerOptions {
    initialIncrement: number;
    incrementTickUpgrade: number;
    onStateChange?: () => void;
    onComplete: () => void;
}

/**
 * A timer manager that handles countdown, increment logic and state management
 */
export class TimerManager {
    private _increment: number;
    private _initialIncrement: number;
    private _incrementTick: number = 0;
    private _incrementTickUpgrade: number;
    private _remainingMinutes: number = 0;
    private _onStateChange: () => void;
    private _onComplete: () => void;

    // Timer state
    private _isRunning: boolean = false;
    private _intervalId: NodeJS.Timeout | null = null;
    private _lastIncrementTime: number = 0;
    private readonly RESET_INCREMENT_TIMEOUT = 5 * 1000; // 5 seconds in milliseconds

    constructor(options: TimerOptions) {
        this._initialIncrement = options.initialIncrement;
        this._increment = options.initialIncrement;
        this._incrementTickUpgrade = options.incrementTickUpgrade;
        this._onStateChange = options.onStateChange || (() => { });
        this._onComplete = options.onComplete;
    }

    start(): void {
        if (this._isRunning) {
            return;
        }

        this._remainingMinutes += this._increment;
        this._isRunning = true;
        this._lastIncrementTime = Date.now();

        // Check immediately if we have time to start with
        if (this._remainingMinutes <= 0) {
            this._isRunning = false;
            this._onComplete();
            return;
        }

        // Start a periodic check every minute
        this._intervalId = setInterval(() => {
            this._remainingMinutes -= 1;
            this._onStateChange();
            console.log(`TimerManager: Timer tick: ${this._remainingMinutes}m`);

            if (this._remainingMinutes <= 0) {
                this.cancel();
                this._onComplete();
            }
        }, 60000); // 1 minute in milliseconds

        // Notify about initial state
        this._onStateChange();
    }

    addTime(): void {
        if (!this._isRunning) {
            this.start();
            return;
        }

        // Check if we should reset the increment value
        if (this.shouldResetIncrement()) {
            console.log('TimerManager: Resetting increment value to default');
            this._increment = this._initialIncrement;
            this._incrementTick = 0;
        } else if (this._incrementTick === this._incrementTickUpgrade) {
            this._increment *= 2;
            this._incrementTick = 0;
        }

        this._incrementTick++;
        this._remainingMinutes += this._increment;
        this._lastIncrementTime = Date.now();
        this._onStateChange();
    }

    cancel(): void {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._isRunning = false;
        this._increment = this._initialIncrement;
        this._incrementTick = 0;
        this._remainingMinutes = 0;
        this._onStateChange();
    }

    isRunning(): boolean {
        return this._isRunning;
    }

    getRemainingMinutes(): number {
        return this._remainingMinutes;
    }

    get currentIncrement(): number {
        return this._increment;
    }

    shouldResetIncrement(): boolean {
        return Date.now() - this._lastIncrementTime > this.RESET_INCREMENT_TIMEOUT;
    }
} 