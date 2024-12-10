import {io, Socket} from 'socket.io-client';

export class ClientWebSocket {
    private readonly _url: string;
    private readonly _port: number;
    private _connection!: Socket;
    private readonly _onConnect: () => void;
    private readonly _onDisconnect: () => void;
    private readonly _onMessage: (message: WebSocketMessageEvent) => void;

    constructor(url: string, port: number, onConnect: () => void, onDisconnect: () => void, onMessage: (message: WebSocketMessageEvent) => void) {
        this._url = url;
        this._port = port;
        this._onConnect = onConnect;
        this._onDisconnect = onDisconnect;
        this._onMessage = onMessage;
        this.connect();
    }

    async connect() {
        const url = `http://${this._url}:${this._port}`;
        this._connection = io(url);
        this._connection.on('connect', this._onConnect);
        this._connection.on('disconnect', this._onDisconnect);
        this._connection.on('message', this._onMessage);
        this._connection.on('connect_error', (error: any) => console.log(error));

        if (this._connection.connected) {
            this._onConnect();
        }
    }

    sendMessage(message: string) {
        if (!this.isConnected()) {
            throw new Error('Disconnected from server');
        }

        this._connection!!.send(message);
    }

    isConnected(): boolean {
        return this._connection?.connected || false;
    }

    disconnect() {
        this._connection?.close();
    }
}
