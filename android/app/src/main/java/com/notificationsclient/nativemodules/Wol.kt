package com.notificationsclient.nativemodules

import android.annotation.SuppressLint
import android.content.Context
import android.net.wifi.WifiManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.InetAddress
import java.net.NetworkInterface


class Wol(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "Wol"

    private fun createMagicPacket(macAddress: String): ByteArray {
        val macBytes = macAddress.split(":").map { it.toInt(16).toByte() }.toByteArray()
        val header = ByteArray(6) { 0xFF.toByte() }
        val magicPacket = ByteArray(102)
        System.arraycopy(header, 0, magicPacket, 0, 6)
        for (i in 0..15) {
            System.arraycopy(macBytes, 0, magicPacket, 6 + i * 6, 6)
        }
        return magicPacket
    }

    @SuppressLint("DefaultLocale")
    private fun getBroadcastAddress(): String {
        NetworkInterface.getNetworkInterfaces().asSequence()
            .filter { it.isUp && !it.isLoopback && !it.isVirtual }.forEach { networkInterface ->
                networkInterface.interfaceAddresses.filter { it.address is Inet4Address && !it.address.isLoopbackAddress }
                    .forEach { interfaceAddress ->
                        // Get the broadcast address directly from the interface
                        val broadcast = interfaceAddress.broadcast
                        if (broadcast != null) {
                            return broadcast.hostAddress ?: ""
                        }
                    }
            }

        // Fallback to WifiManager method if network interfaces fail
        val wifi = reactApplicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val connectionInfo = wifi.connectionInfo
        val ipAddress = connectionInfo.ipAddress

        // If no IP address is found, throw an exception
        require(ipAddress != 0) { "No WiFi IP address found" }

        // Convert int IP to string format
        val formattedIp = String.format(
            "%d.%d.%d.%d",
            ipAddress and 0xff,
            ipAddress shr 8 and 0xff,
            ipAddress shr 16 and 0xff,
            ipAddress shr 24 and 0xff
        )

        // For fallback, calculate broadcast by assuming standard subnet mask
        val subnetMask = "255.255.255.0"
        return calculateBroadcastAddress(formattedIp, subnetMask)
    }

    /**
     * Calculate broadcast address manually
     * @param ipAddress IP address as string
     * @param subnetMask Subnet mask as string
     * @return Broadcast address as string
     */
    private fun calculateBroadcastAddress(ipAddress: String, subnetMask: String): String {
        val ip = ipAddress.split(".").map { it.toInt() }
        val mask = subnetMask.split(".").map { it.toInt() }

        val broadcastAddress = ip.zip(mask).map { (ipOctet, maskOctet) ->
            ipOctet or (maskOctet.inv() and 255)
        }

        return broadcastAddress.joinToString(".")
    }

    @ReactMethod
    private fun sendWolPacket(macAddress: String) {
        try {
            val magicPacket = createMagicPacket(macAddress)
            val broadcastAddress = getBroadcastAddress()
            val port = 7

            // Create and send the DatagramPacket
            val packet = DatagramPacket(
                magicPacket,
                magicPacket.size,
                InetAddress.getByName(broadcastAddress),
                port
            )

            val socket = DatagramSocket()
            socket.send(packet)
            socket.close()

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}