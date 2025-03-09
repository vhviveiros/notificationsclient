import { IllegalValueError } from './errors.ts';

/**
 * Custom assertion function to enforce conditions.
 *
 * This function takes a boolean condition and an optional error message.
 * If the condition is false, it throws an IllegalValueError with the provided message.
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
