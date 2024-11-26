import {ClientWebSocket} from '../api/ClientWebSocket.ts';
import {action, observable} from 'mobx';

const URL: string = '192.168.1.2';
const PORT: number = 5445;

export class ServerConnection {
    private readonly _url: string;
    private readonly _port: number;
    private readonly _connection: ClientWebSocket;
    private static _instance: ServerConnection;

    @observable
    accessor isConnected: boolean = false;

    @observable
    accessor latestMessage: string = '';

    private constructor(url: string, port: number) {
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

    static get instance(): ServerConnection {
        if (!ServerConnection._instance) {
            ServerConnection._instance = new ServerConnection(URL, PORT);
        }

        return ServerConnection._instance;
    }

    @action
    onConnect() {
        console.log('Connected');
        this.isConnected = true;
    }

    @action
    async onDisconnect() {
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
            console.error(e);
        }
    }

    private _onMessage(message: WebSocketMessageEvent) {
        this.setLatestMessage(message.data);
    }
}
