import {useEffect, useState} from 'react';
import {ServerConnection} from '../services/ServerConnection';
import {autorun} from 'mobx';

export const useServerMessage = () => {
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const connection = ServerConnection.instance;

        // Subscribe to changes in `latestMessage`
        const dispose = autorun(() => {
            setMessage(connection.latestMessage);
        });

        return () => dispose(); // Cleanup on unmount
    }, []);

    return message;
};
