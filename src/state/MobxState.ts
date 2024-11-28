import MobxBaseState from './MobxBaseState.ts';

interface MobxState {
    readonly serviceName: string;

    setState(state: MobxBaseState): void;
}

export default MobxState;
