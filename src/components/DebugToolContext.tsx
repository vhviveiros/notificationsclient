import React, {createContext, useContext, useState} from 'react';
import {Text} from 'react-native';

export const DebugToolContext = createContext({
    logs: [], addLog: () => {
    }
});

export const DebugToolProvider = ({children}) => {
    const [logs, setLogs] = useState([]);
    const addLog = (message: string) => {
        setLogs([...logs, message]);
        console.log(message);
    };

    return (
        <DebugToolContext.Provider value={{logs, addLog}}>
            {children}
        </DebugToolContext.Provider>
    );
};

export const DebugTool = ({children}) => {
    const {logs} = useContext(DebugToolContext);

    // Find the first Text component child
    const logDisplayComponent = React.Children.toArray(children).find(
        child => React.isValidElement(child) && child.type === Text
    );

    // If a Text component is found, clone it with logs as children
    if (logDisplayComponent) {
        return React.cloneElement(logDisplayComponent, {
            children: logs.map(log => log),
        });
    }

    // Default render with children
    return <>{children}</>;
};

// Custom hook for logging
export const useDebugLog = () => {
    const {addLog} = useContext(DebugToolContext);
    return addLog;
};
