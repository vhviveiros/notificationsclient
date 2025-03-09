import { IllegalValueError } from './errors.ts';

/**
 * Custom assertion function to enforce conditions.
 *
 * @param {boolean} condition - The condition to check.
 * @param {string} [message='Invalid argument'] - Optional error message to be displayed if the condition fails.
 * @throws {IllegalValueError} If the condition is false, an IllegalValueError is thrown with the specified or default message.
 */
export const require: (condition: boolean, message: string) => asserts condition = (condition: boolean, message: string) => {
    if (!condition) {
        throw new IllegalValueError(message || '');
    }
};

/**
 * Creates a basic timer that counts down minutes and calls callbacks on tick and completion.
 */
export const createDynamicTimer = (
    onComplete: () => void,
    onTick: (minutes: number) => void = () => { },
) => {
    const RESET_INCREMENT_TIMEOUT = 5 * 1000; // 5 seconds in milliseconds

    let remainingMinutes = 0;
    let isRunning = false;
    let intervalId: NodeJS.Timeout | null = null;
    let lastIncrementTime = 0;

    const start = (initialMinutes: number = 0): void => {
        if (isRunning) {
            // Just update the timer without restarting
            remainingMinutes += initialMinutes;
            return;
        }

        remainingMinutes += initialMinutes;
        isRunning = true;
        lastIncrementTime = Date.now();

        // Check immediately if we have time to start with
        if (remainingMinutes <= 0) {
            isRunning = false;
            onComplete();
            return;
        }

        // Start a periodic check every minute
        intervalId = setInterval(() => {
            remainingMinutes -= 1;
            onTick(remainingMinutes);
            if (remainingMinutes <= 0) {
                stop();
                onComplete();
            }
        }, 60000); // 1 minute in milliseconds
    };

    const stop = (): void => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        isRunning = false;
    };

    const addMinutes = (minutes: number): void => {
        remainingMinutes += minutes;
        lastIncrementTime = Date.now();
    };

    const getRemainingMinutes = (): number => {
        return remainingMinutes;
    };

    const isTimerRunning = (): boolean => {
        return isRunning;
    };

    const shouldResetIncrement = (): boolean => {
        return Date.now() - lastIncrementTime > RESET_INCREMENT_TIMEOUT;
    };

    return {
        start,
        stop,
        addMinutes,
        getRemainingMinutes,
        isTimerRunning,
        shouldResetIncrement,
    };
};

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
 * A higher-level timer manager that handles increment logic and state management
 */
export class TimerManager {
    private _timer: ReturnType<typeof createDynamicTimer> | null = null;
    private _increment: number;
    private _initialIncrement: number;
    private _incrementTick: number = 0;
    private _incrementTickUpgrade: number;
    private _remainingMinutes: number = 0;
    private _onStateChange: () => void;
    private _onComplete: () => void;

    constructor(options: TimerOptions) {
        this._initialIncrement = options.initialIncrement;
        this._increment = options.initialIncrement;
        this._incrementTickUpgrade = options.incrementTickUpgrade;
        this._onStateChange = options.onStateChange || (() => { });
        this._onComplete = options.onComplete;
    }

    start(): void {
        if (this.isRunning()) {
            return;
        }

        const onTimerTick = (minutes: number) => {
            this._remainingMinutes = minutes;
            this._onStateChange();
            console.log(`TimerManager: Timer tick: ${minutes}m`);
        };

        const onTimerComplete = () => {
            this.cancel();
            this._onComplete();
        };

        this._timer = createDynamicTimer(onTimerComplete, onTimerTick);
        this._timer.start(this._increment);

        // Set the initial remaining minutes value immediately
        this._remainingMinutes = this._timer.getRemainingMinutes();
        this._onStateChange();
    }

    addTime(): void {
        if (!this._timer) {
            this.start();
            return;
        }

        // Check if we should reset the increment value
        if (this._timer.shouldResetIncrement()) {
            console.log('TimerManager: Resetting increment value to default');
            this._increment = this._initialIncrement;
            this._incrementTick = 0;
        } else if (this._incrementTick === this._incrementTickUpgrade) {
            this._increment *= 2;
            this._incrementTick = 0;
        }

        this._incrementTick++;
        this._timer.addMinutes(this._increment);
        this._remainingMinutes = this._timer.getRemainingMinutes();
        this._onStateChange();
    }

    cancel(): void {
        if (this._timer) {
            this._timer.stop();
            this._timer = null;
            this._increment = this._initialIncrement;
            this._incrementTick = 0;
            this._remainingMinutes = 0;
            this._onStateChange();
        }
    }

    isRunning(): boolean {
        return this._timer?.isTimerRunning() ?? false;
    }

    getRemainingMinutes(): number {
        return this._remainingMinutes;
    }

    // Add a getter for the current increment value
    get currentIncrement(): number {
        return this._increment;
    }

    shouldResetIncrement(): boolean {
        return this._timer?.shouldResetIncrement() ?? false;
    }
} 