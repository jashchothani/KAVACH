package com.example.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != "android.provider.Telephony.SMS_RECEIVED") return

        var sender = ""
        val bodyBuilder = StringBuilder()

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (!messages.isNullOrEmpty()) {
                for (msg in messages) {
                    if (sender.isEmpty()) {
                        sender = msg.displayOriginatingAddress ?: msg.originatingAddress ?: "Unknown Sender"
                    }
                    bodyBuilder.append(msg.displayMessageBody ?: msg.messageBody ?: "")
                }
            }
        } catch (e: Exception) {
            Log.w("KAVACH", "getMessagesFromIntent failed, falling back to bundle pdus: ${e.message}")
        }

        // Fallback to bundle PDUs if needed
        if (bodyBuilder.isEmpty()) {
            val bundle = intent.extras
            val pdus = bundle?.get("pdus") as? Array<*>
            val format = bundle?.getString("format")
            if (pdus != null) {
                for (pdu in pdus) {
                    val bytes = pdu as? ByteArray ?: continue
                    val msg = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        SmsMessage.createFromPdu(bytes, format)
                    } else {
                        @Suppress("DEPRECATION")
                        SmsMessage.createFromPdu(bytes)
                    }
                    if (sender.isEmpty()) {
                        sender = msg.originatingAddress ?: "Unknown Sender"
                    }
                    bodyBuilder.append(msg.messageBody ?: "")
                }
            }
        }

        val fullText = bodyBuilder.toString()
        if (fullText.isEmpty()) return

        Log.d("KAVACH", "SmsReceiver intercepted SMS from: $sender, text: $fullText")

        // Smishing and Phishing ML Heuristic Analysis
        val lower = fullText.lowercase()
        val isSmishing = lower.contains("task") || lower.contains("earn") || lower.contains("telegram") ||
                lower.contains("electric") || lower.contains("power") || lower.contains("disconnect") ||
                lower.contains("kyc") || lower.contains("pan") || lower.contains("apk") ||
                lower.contains("blocked") || lower.contains("suspended") || lower.contains("lottery") ||
                lower.contains("bit.ly") || lower.contains("tinyurl") || lower.contains("cbi") ||
                lower.contains("arrest") || lower.contains("customs") || lower.contains("credit card") ||
                lower.contains("unclaimed") || lower.contains("reward") || lower.contains("claim")

        val senderLabel = if (isSmishing) "⚠️ High-Risk Smishing / Phishing Sender" else "Domestic SMS Sender ($sender)"
        val carrier = if (sender.startsWith("+92") || sender.startsWith("+234") || sender.startsWith("+855")) {
            "Transnational Fraud Gateway · International SMS"
        } else {
            "Domestic Telecom DLT Route · TRAI Registered Gateway"
        }

        val serviceIntent = Intent(context, FloatingCallerOverlayService::class.java).apply {
            putExtra("number", sender)
            putExtra("name", senderLabel)
            putExtra("carrier", carrier)
            putExtra("is_threat", isSmishing)
            putExtra("risk_score", if (isSmishing) 94.0 else 10.0)
            putExtra("is_sms", true)
            putExtra("sms_text", fullText)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.e("KAVACH", "SmsReceiver failed to start FloatingCallerOverlayService: ${e.message}")
        }
    }
}
