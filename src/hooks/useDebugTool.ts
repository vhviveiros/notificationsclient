import {useContext} from 'react';
import {DebugToolContext} from '../components/DebugToolContext.tsx';

export const useDebugTool = () => {
    const {addLog} = useContext(DebugToolContext);
    return addLog;
};
