import { InjectionToken } from 'tsyringe';
import container from '../../tsyringe.dependencies.ts';
import { useEffect, useState } from 'react';
import MobxState from '../state/MobxState.ts';

const useStates = <T extends MobxState>(token: InjectionToken<T>): T => {
    const [state, setState] = useState<T>(() => container.resolve<T>(token));
    useEffect(() => {
        setState(container.resolve(token) as T);
    }, [token]);
    return state;
};

export default useStates;
