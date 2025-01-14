import {ClientWebSocket} from '../api/ClientWebSocket.ts';
import {action, observable} from 'mobx';
import Service from './Service.ts';
import ForegroundService from './ForegroundService.ts';
import {NativeModules} from 'react-native';

export const DEFAULT_URL: string = '192.168.1.2';
export const DEFAULT_PORT: number = 5445;

const {Wol} = NativeModules;

export default class ConnectionService extends Service {
    serviceName: string = 'ConnectionService';
    private static _instance: ConnectionService;

    private _url!: string;
    private _port!: number;
    private _connection!: ClientWebSocket;
    private _reconnectionTimeout: number = 10000;
    private _isCheckingConnection: boolean = false;

    setDefaultTimeout() {
        this._reconnectionTimeout = 10000;
    }

    setQuickReconnectTimeout() {
        this._reconnectionTimeout = 500;
    }

    @observable
    accessor isConnected: boolean = false;

    @observable
    accessor latestMessage: string = '';

    static get instance() {
        if (!this._instance) {
            this._instance = new ConnectionService();
        }
        return this._instance;
    }

    private constructor() {
        super();
    }

    init(url: string = DEFAULT_URL, port: number = DEFAULT_PORT) {
        this._url = url;
        this._port = port;
        this._connection = new ClientWebSocket(
            this._url,
            this._port,
            this._onConnect.bind(this),
            this._onDisconnect.bind(this),
            this._onMessage.bind(this)
        );
        this.isRunning = true;
    }

    @action
    private _onConnect() {
        console.log('Connected');
        this.isConnected = true;
    }

    @action
    async _onDisconnect() {
        console.log('Disconnected');
        if (!ForegroundService.instance.isRunning) {
            return;
        }

        // Handle reconnection timeout reset
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const checkConnection = async () => {
            if (this._isCheckingConnection) {
                return;
            }
            try {
                console.log('Checking connection...');
                this._isCheckingConnection = true;
                // We're trying to reconnect here as soon as possible
                this.setQuickReconnectTimeout();

                // Disconnect after n seconds if the connection is not re-established
                await sleep(5000);

                if (!ConnectionService.instance._connection!.isConnected()) {
                    ConnectionService.instance.isConnected = false;
                    this.setDefaultTimeout();
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

    @action
    setLatestMessage(message: string) {
        this.latestMessage = message;
    }

    sendMessage(message: string) {
        try {
            this._connection!.sendMessage(message);
        } catch (e) {
            // @ts-ignore
            console.error(e.stack);
        }
    }

    suspendServer() {
        console.log('Sending suspend command...');
        this.sendMessage('{"command":"suspend"}');
        this._connection!.disconnect();
    }

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

    disconnect() {
        this._connection!.disconnect();
    }

    /**
     * Event handler for when a message is received from the server.
     * Updates the latestMessage observable with the received message.
     * @param {WebSocketMessageEvent} message The received message event.
     */
    private _onMessage(message: WebSocketMessageEvent) {
        this.setLatestMessage(message.data);
    }

    stop() {
        this.disconnect();
        this.latestMessage = '';
        super.stop();
    }
}
