import dgram from 'react-native-udp';

/**
 * Creates the magic packet needed to wake a device via Wake-on-LAN.
 *
 * The magic packet is a UDP datagram containing six bytes of all ones
 * (0xFF) followed by sixteen repetitions of the target computer's MAC
 * address.
 *
 * @param {string} mac The MAC address of the device to wake up, in hexadecimal
 *                     representation with each byte separated by a colon (e.g.,
 *                     "01:23:45:67:89:AB").
 */
const createMagicPacket = (mac: string) => {
    const header = Buffer.alloc(6, 0xff);
    const macBuffer = Buffer.from(mac, 'hex');
    const macRepeated = Buffer.concat(Array(16).fill(macBuffer));
    return Buffer.concat([header, macRepeated]);
};

/**
 * Retrieves the broadcast address of the device's current network interface.
 *
 * This is usually the IP address of the interface with the last octet set to 255.
 * If the IP address can't be determined, it defaults to `255.255.255.255`.
 *
 * @returns {Promise<string>} The broadcast address of the device's network interface.
 */
const getBroadcastAddress = async () => {
    try {
        // const ipAddress = await NetworkInfo.getIPAddress();
        const ipAddress = '192.168.1.127';

        if (!ipAddress) {
            return '255.255.255.255';
        }

        const octets = ipAddress.split('.');
        octets[3] = '255';
        return octets.join('.');
    } catch (error) {
        console.error('Could not get broadcast address:', error);
        return '255.255.255.255';
    }
};

/**
 * Sends a Wake-on-LAN (WoL) packet to the specified MAC address.
 *
 * The device should be connected to the same network as the device running
 * this code. If the device is connected to a different network, the packet will
 * not be routed to the target device.
 *
 * The WoL packet is sent to the broadcast address of the device's network
 * interface, which is usually the IP address of the interface with the last
 * octet set to 255. If the IP address can't be determined, it defaults to
 * `255.255.255.255`.
 *
 * @param {string} macAddress - The MAC address of the device to wake up, in
 *                              hexadecimal representation with each byte
 *                              separated by a colon (e.g., "01:23:45:67:89:AB")
 */
const sendWOLPacket = async (macAddress: string) => {
    try {
        // Remove any separators and convert MAC address to standard format
        const mac = macAddress.replace(/[^0-9A-Fa-f]/g, '');

        // Validate MAC address format
        if (!/^[0-9A-Fa-f]{12}$/.test(mac)) {
            throw new Error('Invalid MAC address format');
        }

        // Create magic packet
        const magicPacket = createMagicPacket(mac);

        // Get broadcast address
        const broadcastAddress = await getBroadcastAddress();

        // Create UDP socket
        const socket = dgram.createSocket({ type: 'udp4' });

        // Send magic packet
        socket.send(magicPacket, 0, magicPacket.length, 9, broadcastAddress, (err) => {
            if (err) {
                console.error('Error sending WoL packet:', err);
            } else {
                console.log('WoL packet sent successfully');
            }
            socket.close();
        });
    } catch (error) {
        console.error('WoL packet sending failed:', error);
    }
};

export default sendWOLPacket;
