import sendWOLPacket from './Wol.ts';

export class ClientWebSocket {
    private readonly _url: string;
    private readonly _port: number;
    private _connection!: WebSocket;
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

    connect() {
        try {
            if (this._connection?.readyState === WebSocket.OPEN) {
                return;
            }
            const uri = `ws://${this._url}:${this._port}`;
            console.log(`Attempting to connect to ${uri}...`);
            this._connection = new WebSocket(uri);
            console.log('WebSocket object created.');
            this._connection.onopen = this._onConnect;
            this._connection.onclose = this._onDisconnect;
            this._connection.onmessage = this._onMessage;
            this._connection.onerror = this._onError;
            // @ts-ignore
        } catch (e: Error) {
            console.error(`Error while connecting: ${e.message}`);
            console.error(e.stack);
        }
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

    disconnect() {
        if (this.isConnected()) {
            this._connection.close();
        }
    }

    private _onError(error: WebSocketErrorEvent) {
        console.error(`WebSocket connection error: ${error.message}`);
    }

    /**
     * Sends a Wake-on-LAN packet to the specified MAC address.
     *
     * @param {string} macAddress - The MAC address of the device to wake up.
     * @returns {Promise<string>} A promise that resolves with a success message if the packet is sent successfully,
     * or rejects with an error if the operation fails.
     */
    async sendWoL(macAddress: string) {
        return new Promise((resolve, reject) => {
            try {
                sendWOLPacket(macAddress);
                resolve('Package sent successfully');
            } catch (error) {
                // @ts-ignore
                console.error(`Error sending wol package: ${error.stack}`);
                reject(error);
            }
        });
    }
}
