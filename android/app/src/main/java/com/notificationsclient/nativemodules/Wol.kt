package com.notificationsclient.nativemodules

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress


class Wol(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "Wol"

    private fun createMagicPacket(macAddress: String): ByteArray {
        val cleanedMac = macAddress.replace("[:\\-]".toRegex(), "")
        require(cleanedMac.length == 12) { "Invalid MAC address format" }

        val macBytes = cleanedMac.chunked(2).map { it.toInt(16).toByte() }.toByteArray()

        // Create magic packet with proper array construction
        return ByteArray(6) { 0xFF.toByte() } + ByteArray(16 * macBytes.size) { i -> macBytes[i % macBytes.size] }
    }

    @ReactMethod
    fun sendWolPacket(macAddress: String, targetIp: String) {
        try {
            val magicPacket = createMagicPacket(macAddress)
            val address = InetAddress.getByName(targetIp)
            val port = 9 // Default Wake-on-LAN port

            DatagramSocket().use { socket ->
                val packet = DatagramPacket(
                    magicPacket,
                    magicPacket.size,
                    address,
                    port
                )
                socket.send(packet)
                Log.d("WOL", "Magic packet sent to $macAddress via $targetIp")
            }
        } catch (e: Exception) {
            Log.e("WOL", "Error sending Wake-on-LAN packet", e)
        }
    }
}
