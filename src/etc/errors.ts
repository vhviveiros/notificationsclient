export class IllegalArgumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IllegalArgumentError';
    }
}

export class UnknownRegistryKeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnknownRegistryKeyError';
    }
}
