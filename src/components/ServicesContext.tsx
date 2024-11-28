import React, {createContext, useContext, useState} from 'react';

import ConnectionService from '../services/ConnectionService.ts';
import PersistentService from '../services/PersistentService.ts';
import NotificationsService from '../services/NotificationsService.ts';

interface ServicesContextType {
    persistentService: PersistentService;
    connectionService: ConnectionService;
    notificationsService: NotificationsService;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [persistentService] = useState(() => PersistentService.instance);

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

export const useServices = (): ServicesContextType => {
    const context = useContext(ServicesContext);
    if (context === undefined) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return context;
};
