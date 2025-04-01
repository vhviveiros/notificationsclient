/**
 * A class to manage WebSocket connections and communication.
 */
export class ClientWebSocket {
    private readonly _url: string; // WebSocket server URL
    private readonly _port: number; // WebSocket server port
    private _connection!: WebSocket; // WebSocket connection instance
    private readonly _onConnect: () => void; // Callback for successful connection
    private readonly _onDisconnect: () => void; // Callback for disconnection
    private readonly _onMessage: (message: WebSocketMessageEvent) => void; // Callback for incoming messages

    /**
     * Initializes the WebSocket client.
     * @param {string} url - The WebSocket server URL.
     * @param {number} port - The WebSocket server port.
     * @param {() => void} onConnect - Callback executed upon connection.
     * @param {() => void} onDisconnect - Callback executed upon disconnection.
     * @param {(message: WebSocketMessageEvent) => void} onMessage - Callback for incoming messages.
     */
    constructor(url: string, port: number, onConnect: () => void, onDisconnect: () => void, onMessage: (message: WebSocketMessageEvent) => void) {
        this._url = url;
        this._port = port;
        this._onConnect = onConnect;
        this._onDisconnect = onDisconnect;
        this._onMessage = onMessage;
        this.connect();
    }

    /**
     * Establishes a connection to the WebSocket server.
     *
     * If the connection is already open, this method does nothing.
     */
    connect() {
        try {
            if (this._connection?.readyState === WebSocket.OPEN) {
                return;
            }
            const uri = `ws://${this._url}:${this._port}`;
            console.log(`Attempting to connect to ${uri}...`);
            this._connection = new WebSocket(uri);
            console.log('WebSocket object created.');

            // Assign event handlers
            this._connection.onopen = this._onOpen.bind(this);
            this._connection.onclose = this._onDisconnect;
            this._connection.onmessage = this._manageIncomingMessage.bind(this);
            this._connection.onerror = this._onError;
            // @ts-ignore
        } catch (e: Error) {
            console.error(`Error while connecting: ${e.message}`);
            console.error(e.stack);
        }
    }

    /**
     * Sends a message through the WebSocket connection.
     * @param {string} message - The message to send.
     * @throws Error throw an error if the WebSocket is not connected.
     */
    sendMessage(message: string) {
        if (!this.isConnected()) {
            throw new Error('Disconnected from server');
        }
        try {
            this._connection!!.send(message);
        } catch (e) {
            console.error(`Error while sending message: ${(e as Error).message}`);
        }
    }

    /**
     * Checks if the WebSocket connection is open.
     * @returns {boolean} True if the connection is open, false otherwise.
     */
    isConnected(): boolean {
        return this._connection?.readyState === WebSocket.OPEN;
    }

    /**
     * Closes the WebSocket connection if it is open.
     */
    disconnect() {
        if (this.isConnected()) {
            this._connection.close();
        }
    }

    /**
     * Handles WebSocket errors.
     * @param {WebSocketErrorEvent} error - The error event.
     * @private
     */
    private _onError(error: WebSocketErrorEvent) {
        console.error(`WebSocket connection error: ${error.message}`);
    }

    /**
     * Handles the `onopen` event of the WebSocket connection.
     * @private
     */
    private _onOpen() {
        this._onConnect();
        this._checkIsAlive();
    }

    /**
     * Manages incoming WebSocket messages.
     * @param {WebSocketMessageEvent} message - The incoming message event.
     * @private
     */
    private _manageIncomingMessage(message: WebSocketMessageEvent) {
        console.log(`Message received: ${message.data}`);
        if (message.data === 'pong') {
            return;
        }
        this._onMessage(message);
    }

    /**
     * Periodically checks if the WebSocket connection is alive by sending ping messages.
     * Disconnects if no `pong` response is received within 5 seconds.
     * @private
     */
    private async _checkIsAlive() {
        const timeout = 10000;
        do {
            const promises: Promise<string>[] = [
                new Promise((resolve) => {
                    const listener = (message: WebSocketMessageEvent) => {
                        if (message.data === 'pong') {
                            this._connection.removeEventListener('message', listener);
                            resolve('pong');
                        }
                    };
                    this._connection.addEventListener('message', listener);
                }),
                new Promise((resolve) => setTimeout(resolve, timeout, 'timeout')),
            ];

            this._pingServer();

            await Promise.race(promises).then((result) => {
                if (result === 'timeout') {
                    console.error('No pong received. Disconnecting...');
                    this.disconnect();
                }
            });

            await new Promise(resolve => setTimeout(resolve, timeout));
        } while (this.isConnected());
    }

    /**
     * Sends a ping message to the WebSocket server.
     * @private
     */
    private _pingServer() {
        if (this.isConnected()) {
            this.sendMessage('ping');
        }
    }
}
