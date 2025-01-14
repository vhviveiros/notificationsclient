import MobxBaseState from './MobxBaseState.ts';

interface MobxState {
    readonly serviceName: string;

    setState(state: MobxBaseState): void;

    hasInit(): boolean;
}

export default MobxState;
