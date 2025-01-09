package com.notificationsclient.nativemodules

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.NetworkInterface


class Wol(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "Wol"

    private fun createMagicPacket(macAddress: String): ByteArray {
        val cleanMac = macAddress.replace(Regex("[^0-9a-fA-F]"), "")
        if (cleanMac.length != 12) {
            throw IllegalArgumentException("Invalid MAC address format")
        }

        val macBytes = ByteArray(6)
        for (i in 0..5) {
            macBytes[i] = cleanMac.substring(i * 2, i * 2 + 2).toInt(16).toByte()
        }

        val header = ByteArray(6) { 0xFF.toByte() }
        val magicPacket = ByteArray(102)
        System.arraycopy(header, 0, magicPacket, 0, 6)
        for (i in 0..15) {
            System.arraycopy(macBytes, 0, magicPacket, 6 + i * 6, 6)
        }
        return magicPacket
    }

    @ReactMethod
    fun sendWolPacket(macAddress: String, targetIp: String, targetPort: Int) {
        try {
            val magicPacket = createMagicPacket(macAddress)
            val socket = DatagramSocket().apply {
                broadcast = true
            }

            // Create list of target addresses (including broadcast)
            val targetAddresses = mutableListOf<InetAddress>().apply {
                add(InetAddress.getByName(targetIp))
                add(InetAddress.getByName("255.255.255.255"))  // Global broadcast
                // Add subnet broadcast address if available
                NetworkInterface.getNetworkInterfaces().asSequence()
                    .filter { it.isUp && !it.isLoopback }
                    .forEach { networkInterface ->
                        networkInterface.interfaceAddresses
                            .mapNotNull { it.broadcast }
                            .forEach { add(it) }
                    }
            }

            // Send multiple packets to each address
            repeat(3) { attempt ->
                targetAddresses.forEach { address ->
                    val packet = DatagramPacket(
                        magicPacket,
                        magicPacket.size,
                        address,
                        targetPort
                    )

                    try {
                        socket.send(packet)
                        Log.d("Wol", "Sent packet ${attempt + 1} to ${address.hostAddress}:$targetPort")
                    } catch (e: Exception) {
                        Log.w("Wol", "Failed to send to ${address.hostAddress}: ${e.message}")
                    }
                }
                Thread.sleep(100)
            }

            socket.close()
        } catch (e: Exception) {
            Log.e("Wol", "Exception caught when sending WoL packet:", e)
            throw e
        }
    }
}
