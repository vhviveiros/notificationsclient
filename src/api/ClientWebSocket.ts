export class ClientWebSocket {
    private readonly _url: string;
    private readonly _port: number;
    private _connection: WebSocket | undefined;
    private readonly _onConnect: () => void;
    private readonly _onDisconnect: () => void;
    private readonly _onMessage: (message: WebSocketMessageEvent) => void;

    constructor(url: string, port: number, onConnect: () => void, onDisconnect: () => void, onMessage: (message: WebSocketMessageEvent) => void) {
        this._url = url;
        this._port = port;
        console.log(`Connecting to ws://${this._url}:${this._port}`);
        this._onConnect = onConnect;
        this._onDisconnect = onDisconnect;
        this._onMessage = onMessage;
        this.connect();
    }

    connect() {
        if (this._connection?.readyState === WebSocket.OPEN) {
            return;
        }
        console.log('Attempting to connect...');
        this._connection = new WebSocket(`ws://${this._url}:${this._port}`);
        this._connection.onopen = this._onConnect;
        this._connection.onclose = this._onDisconnect;
        this._connection.onmessage = this._onMessage;
    }

    sendMessage(message: string) {
        if (!this.isConnected()) {
            throw new Error('Disconnected from server');
        }

        this._connection!!.send(message);
    }

    isConnected(): boolean {
        return this._connection?.readyState === WebSocket.OPEN;
    }
}
