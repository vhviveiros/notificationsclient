import {useContext} from 'react';
import {ServicesContext, ServicesContextType} from '../components/ServicesContext.tsx';

const useServices = (): ServicesContextType => {
    const context = useContext(ServicesContext);
    if (context === undefined) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return context;
};

export default useServices;
