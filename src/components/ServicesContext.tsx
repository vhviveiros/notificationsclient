import React, {createContext, useState} from 'react';

import ConnectionService from '../services/ConnectionService.ts';
import MainService from '../services/MainService.ts';
import NotificationsService from '../services/NotificationsService.ts';

export interface ServicesContextType {
    persistentService: MainService;
    connectionService: ConnectionService;
    notificationsService: NotificationsService;
}

export const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [persistentService] = useState(() => MainService.instance);

    return (
        <ServicesContext.Provider value={{
            persistentService,
            connectionService: persistentService.connectionService,
            notificationsService: persistentService.notificationsService,
        }}>
            {children}
        </ServicesContext.Provider>
    );
};
