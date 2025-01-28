import MobxBaseState from './MobxBaseState.ts';

interface MobxState {
    readonly identifier: string;

    setState(state: MobxBaseState): void;

    hasInit(): boolean;
}

export default MobxState;
