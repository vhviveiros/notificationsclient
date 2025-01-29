import MobxBaseState from './MobxBaseState.ts';

interface MobxState {
    readonly identifier: Symbol;

    setState(state: MobxBaseState): void;

    hasInit(): boolean;
}

export default MobxState;
