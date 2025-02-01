/**
 * ConnectionService manages WebSocket connections between the client and server.
 * It handles connection lifecycle, message passing, and server power management.
 * 
 * @remarks
 * This service is implemented as a singleton and extends the base Service class.
 * It uses MobX for state management and observability.
 */

import { ClientWebSocket } from '../api/ClientWebSocket.ts';
import { action, makeObservable, observable } from 'mobx';
import Service from './Service.ts';
import { NativeModules } from 'react-native';
import { singleton } from 'tsyringe';
import { TYPES } from '../../tsyringe.types.ts';
import { IllegalValueError } from '../etc/errors.ts';

/** Default WebSocket server URL */
export const DEFAULT_URL: string = '192.168.1.2';
/** Default WebSocket server port */
export const DEFAULT_PORT: number = 5445;

const { Wol } = NativeModules;

@singleton()
export default class ConnectionService extends Service {
    /** WebSocket server URL */
    private _url!: string;
    /** WebSocket server port */
    private _port!: number;
    /** WebSocket client instance */
    private _connection!: ClientWebSocket;
    /** Timeout duration (ms) between reconnection attempts */
    private _reconnectionTimeout: number = 10000;
    /** Flag to prevent concurrent connection checks */
    private _isCheckingConnection: boolean = false;
    /** Observable connection status */
    isConnected: boolean = false;
    /** Observable latest received message */
    latestMessage: string = '';

    /**
     * Initializes the ConnectionService and sets up MobX observables and actions
     */
    constructor() {
        super(TYPES.ConnectionService);
        makeObservable(this, {
            isConnected: observable,
            latestMessage: observable,
            onConnect: action,
            onDisconnect: action,
            disconnect: action,
            setLatestMessage: action,
        });
    }

    /** Timeout values in milliseconds for different connection states */
    private readonly _timeoutValues = {
        default: 10000,
        quick: 500,
        suspended: 30000
    };

    /**
     * Sets the reconnection timeout based on the specified mode
     * @param mode - The timeout mode ('default', 'quick', or 'suspended')
     */
    setReconnectionTimeout(mode: 'default' | 'quick' | 'suspended') {
        if (!(mode in this._timeoutValues)) {
            throw new IllegalValueError(`Illegal argument: mode must be one of: ${Object.keys(this._timeoutValues).join(', ')}`);
        }
        this._reconnectionTimeout = this._timeoutValues[mode];
    }

    /**
     * Initializes the WebSocket connection with the server
     * @param url - Server URL, defaults to DEFAULT_URL
     * @param port - Server port, defaults to DEFAULT_PORT
     */
    init(url: string = DEFAULT_URL, port: number = DEFAULT_PORT) {
        this.connect(url, port);
    }

    /**
     * Connects to the WebSocket server
     * @param url - Server URL
     * @param port - Server port
     */
    private connect(url: string, port: number) {
        console.log(`ConnectionService: Connecting to ${url}:${port}`);
        this._url = url;
        this._port = port;
        this._connection = new ClientWebSocket(
            this._url,
            this._port,
            this.onConnect.bind(this),
            this.onDisconnect.bind(this),
            this._onMessage.bind(this)
        );
    }

    /**
     * Handles successful connection events
     */
    onConnect() {
        console.log('Connected');
        this.isConnected = true;
        this.setReconnectionTimeout('quick');
    }

    /**
     * Handles disconnection events and manages reconnection attempts
     */
    async onDisconnect() {
        console.log('Disconnected');
        //Skip reconnection if service is not running
        if (!this.isRunning) return;
        // Handle reconnection timeout reset
        const sleep = (ms: number) => new Promise(resolve => setTimeout((resolve as () => void), ms));

        const checkConnection = async () => {
            if (this._isCheckingConnection) {
                return;
            }
            try {
                console.log('Checking connection...');
                this._isCheckingConnection = true;
                // We're trying to reconnect here as soon as possible
                this.setReconnectionTimeout('quick');
                // Disconnect after n seconds if the connection is not re-established
                await sleep(5000);
                if (!this._connection!.isConnected()) {
                    this.isConnected = false;
                    this.setReconnectionTimeout('default');
                }
            } finally {
                console.log('Checking connection finished');
                this._isCheckingConnection = false;
            }
        };

        checkConnection();

        console.log('Reconnecting after calling checkConnection...');
        await sleep(this._reconnectionTimeout);
        this._connection!.connect();
    }

    /**
     * Updates the latest message and logs it
     * @param message - The message to set
     */
    setLatestMessage(message: string) {
        this.latestMessage = message;
        console.log(`ConnService Latest message: ${message}`);
    }

    /**
     * Sends a message to the server
     * @param message - The message to send
     */
    sendMessage(message: string) {
        try {
            this._connection!.sendMessage(message);
        } catch (e) {
            // @ts-ignore
            console.error(e.stack);
        }
    }

    /**
     * Sends suspend command to server and disconnects
     */
    suspendServer() {
        console.log('Sending suspend command...');
        this.setReconnectionTimeout('suspended');
        this.sendMessage('{"command":"suspend"}');
        this._connection!.disconnect();
    }

    /**
     * Wakes up the server using Wake-on-LAN
     * @returns Promise resolving to success message
     * @throws Error if WoL packet sending fails
     */
    async awakeServer() {
        console.log('Sending awake command...');
        const macAddress = '24:f5:aa:52:f9:8c';
        const targetIp = '192.168.1.2';

        try {
            await Wol.sendWolPacket(macAddress, targetIp);
            return 'Package sent successfully';
        } catch (error) {
            console.error(`Error sending wol package: ${(error as Error).stack}`);
            throw error;
        }
    }

    /**
     * Disconnects from the WebSocket server
     */
    disconnect() {
        this._connection!.disconnect();
    }

    /**
     * Event handler for when a message is received from the server.
     * Updates the latestMessage observable with the received message.
     * @param {WebSocketMessageEvent} message - The received message event
     */
    private _onMessage(message: WebSocketMessageEvent) {
        this.setLatestMessage(message.data);
    }

    /**
     * Stops the service, disconnects from server and clears latest message
     */
    stop() {
        this.disconnect();
        this.latestMessage = '';
        super.stop();
    }
}
