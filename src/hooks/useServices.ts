import {InjectionToken} from 'tsyringe';
import container from '../../tsyringe.dependencies.ts';
import {useEffect, useState} from 'react';
import Service from '../services/Service.ts';

const useServices = <T extends Service>(token: InjectionToken<T>): T => {
    const [service, setService] = useState<T>(() => container.resolve<T>(token));
    useEffect(() => {
        setService(container.resolve(token) as T);
    }, [token]);
    return service;
};

export default useServices;
