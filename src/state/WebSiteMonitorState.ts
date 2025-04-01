import { action, makeObservable, observable } from 'mobx';
import MobxBaseState from './MobxBaseState';
import MobxState from './MobxState';
import { TYPES } from '../../tsyringe.types';
import { singleton } from 'tsyringe';

/**
 * Represents a website being monitored
 * @interface Site
 * @property {string} name - The display name of the website
 * @property {string} url - The URL of the website to monitor
 * @property {boolean} isUp - Whether the website is currently accessible
 */
interface Site {
    name: string;
    url: string;
    isUp: boolean;
}

/**
 * State data for website monitoring
 * @interface WebSiteMonitorStateData
 * @extends MobxBaseState
 * @property {Record<string, Site>} sites - Map of site URLs to their monitoring state
 */
interface WebSiteMonitorStateData extends MobxBaseState {
    sites: Record<string, Site>;
}

/**
 * MobX state class for managing website monitoring
 * @class WebSiteMonitorState
 * @implements MobxState
 */
@singleton()
export default class WebSiteMonitorState implements MobxState, WebSiteMonitorStateData {
    readonly identifier = TYPES.WebSiteMonitorState;

    /** @observable Map of monitored sites */
    @observable
    sites: Record<string, Site> = {};

    /** Flag indicating if state has been initialized */
    private _hasInitialized: boolean = false;

    constructor() {
        makeObservable(this);
    }

    /**
     * Updates the state with new site data
     * @param {WebSiteMonitorStateData} state - New state data to apply
     */
    @action
    setState(state: WebSiteMonitorStateData): void {
        this.sites = state.sites;
        this._hasInitialized = true;
    }

    /**
     * Checks if the state has been initialized
     * @returns {boolean} True if state has been initialized
     */
    hasInit(): boolean {
        return this._hasInitialized;
    }
}