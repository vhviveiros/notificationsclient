export class IllegalValueError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalValueError';
    }
}

export class UnknownRegistryKeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnknownRegistryKeyError';
    }
}
