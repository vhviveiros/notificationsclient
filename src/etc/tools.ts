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