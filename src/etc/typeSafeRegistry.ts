import Service from '../services/Service.ts';
import MobxState from '../state/MobxState.ts';
import { UnknownRegistryKeyError } from './errors.ts';

/**
 * A type-safe registry that stores and retrieves items by symbol keys.
 * @template T The base type of items stored in the registry
 */
class TypeSafeRegistry<T> {
    /** Internal map storing the registry items */
    private _map = new Map<symbol, T>();

    /**
     * Gets an item from the registry by its symbol key.
     * @template U Type of the specific item being retrieved, must extend T
     * @param key The symbol key to look up
     * @returns The item of type U
     * @throws {UnknownRegistryKeyError} If the key is not found in the registry
     */
    get<U extends T>(key: symbol): U {
        const item = this._map.get(key);
        if (!item) throw new UnknownRegistryKeyError(`Registry ${key.description} not found`);
        return item as U;
    }

    /**
     * Sets an item in the registry with the given symbol key.
     * @template U Type of the specific item being set, must extend T
     * @param key The symbol key to store the item under
     * @param item The item to store
     */
    set<U extends T>(key: symbol, item: U): void {
        this._map.set(key, item);
    }

    /**
     * Executes a callback for each item in the registry.
     * @param callbackfn Function to execute for each item
     */
    forEach(callbackfn: (value: T, key: symbol, map: Map<symbol, T>) => void): void {
        this._map.forEach(callbackfn);
    }
}

/**
 * A specialized TypeSafeRegistry for storing Service instances.
 * Used for dependency injection and service management.
 */
class TypeSafeServiceRegistry extends TypeSafeRegistry<Service> {
}

/**
 * A specialized TypeSafeRegistry for storing MobxState instances.
 * Used for state management across the application.
 */
class TypeSafeStateRegistry extends TypeSafeRegistry<MobxState> {
}

export { TypeSafeServiceRegistry, TypeSafeStateRegistry };
