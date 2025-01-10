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
        val macBytes = macAddress.split(":").map { it.toInt(16).toByte() }.toByteArray()
        val header = ByteArray(6) { 0xFF.toByte() }
        val magicPacket = ByteArray(102)
        System.arraycopy(header, 0, magicPacket, 0, 6)
        for (i in 0..15) {
            System.arraycopy(macBytes, 0, magicPacket, 6 + i * 6, 6)
        }
        return magicPacket
    }

    @ReactMethod
    private fun sendWolPacket(macAddress: String, targetIp: String) {
        try {
            val magicPacket = createMagicPacket(macAddress)

            // Create and send the DatagramPacket
            intArrayOf(7, 9).forEach { port ->
                val packet = DatagramPacket(
                    magicPacket,
                    magicPacket.size,
                    InetAddress.getByName(targetIp),
                    port
                )

                Log.d("Wol", "Sending magic packet to $targetIp:$port")
                val socket = DatagramSocket()
                socket.send(packet)
                socket.close()
            }
        } catch (e: Exception) {
            Log.e("Wol", "Exception caught when sending wol packet:")
            e.printStackTrace()
        }
    }
}
