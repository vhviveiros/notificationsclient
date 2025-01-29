import Service from '../services/Service.ts';
import MobxState from '../state/MobxState.ts';
import {UnknownRegistryKeyError} from './errors.ts';

class TypeSafeRegistry<T> {
    private _map = new Map<symbol, T>();

    get<U extends T>(key: symbol): U {
        const item = this._map.get(key);
        if (!item) throw new UnknownRegistryKeyError(`Registry ${key.description} not found`);
        return item as U;
    }

    set<U extends T>(key: symbol, item: U): void {
        this._map.set(key, item);
    }

    forEach(callbackfn: (value: T, key: symbol, map: Map<symbol, T>) => void): void {
        this._map.forEach(callbackfn);
    }
}

class TypeSafeServiceRegistry extends TypeSafeRegistry<Service> {
}

class TypeSafeStateRegistry extends TypeSafeRegistry<MobxState> {
}

export {TypeSafeServiceRegistry, TypeSafeStateRegistry};
