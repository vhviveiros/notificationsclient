import {IllegalArgumentError} from './errors.ts';

export const require: (condition: boolean, message: string) => asserts condition = (condition: boolean, message: string) => {
    if (!condition) {
        throw new IllegalArgumentError(message);
    }
};
