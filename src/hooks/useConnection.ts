import {useEffect, useState} from 'react';
import {autorun} from 'mobx';
import PersistentService from '../services/PersistentService.ts';

export const useServerMessage = () => {
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const connection = PersistentService.instance.connectionService;

        // Subscribe to changes in `latestMessage`
        const dispose = autorun(() => {
            setMessage(connection.latestMessage);
        });

        return () => dispose(); // Cleanup on unmount
    }, []);

    return message;
};
