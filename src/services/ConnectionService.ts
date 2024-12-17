import {ClientWebSocket} from '../api/ClientWebSocket.ts';
import {action, observable} from 'mobx';
import Service from './Service.ts';

export const DEFAULT_URL: string = '192.168.1.2';
export const DEFAULT_PORT: number = 5445;

export default class ConnectionService extends Service {
    private static _instance: ConnectionService;

    private _url!: string;
    private _port!: number;
    private _connection!: ClientWebSocket;

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

    init(url: string, port: number) {
        this._url = url;
        this._port = port;
        this._connection = new ClientWebSocket(
            this._url,
            this._port,
            this._onConnect.bind(this),
            this._onDisconnect.bind(this),
            this._onMessage.bind(this)
        );
    }

    @action
    private _onConnect() {
        console.log('Connected');
        this.isConnected = true;
    }

    @action
    async _onDisconnect() {
        console.log('Disconnected');
        this.isConnected = false;
        await new Promise(resolve => setTimeout(resolve, 10000));
        this._connection.connect();
    }

    @action
    setLatestMessage(message: string) {
        this.latestMessage = message;
    }

    sendMessage(message: string) {
        try {
            this._connection.sendMessage(message);
        } catch (e) {
            // @ts-ignore
            console.error(e.stack);
        }
    }

    suspendServer() {
        console.log('Sending suspend command...');
        this.sendMessage('{"command":"suspend"}');
        this._connection.disconnect();
    }

    awakeServer() {
        console.log('Sending awake command...');
        this._connection.sendWoL('24:f5:aa:52:f9:8c', '192.168.1.2');
    }

    /**
     * Event handler for when a message is received from the server.
     * Updates the latestMessage observable with the received message.
     * @param {WebSocketMessageEvent} message The received message event.
     */
    private _onMessage(message: WebSocketMessageEvent) {
        this.setLatestMessage(message.data);
    }
}
