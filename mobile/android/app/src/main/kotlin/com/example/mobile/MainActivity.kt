package com.example.mobile

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.cyberkavach.mobile/telephony"
    private val PERMISSION_REQUEST_CODE = 701
    private var pendingPermissionResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkOverlayPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        result.success(Settings.canDrawOverlays(this))
                    } else {
                        result.success(true)
                    }
                }

                "requestOverlayPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        try {
                            val intent = Intent(
                                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:$packageName")
                            )
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            startActivity(intent)
                            result.success(true)
                        } catch (e: Exception) {
                            try {
                                val genericIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                                genericIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                startActivity(genericIntent)
                                result.success(true)
                            } catch (fallbackEx: Exception) {
                                result.error("OVERLAY_ERROR", fallbackEx.localizedMessage, null)
                            }
                        }
                    } else {
                        result.success(true)
                    }
                }

                "checkTelephonyPermissions" -> {
                    val phoneGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED
                    val callLogGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALL_LOG) == PackageManager.PERMISSION_GRANTED
                    val receiveSmsGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                    val readSmsGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                    val notifGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
                    } else {
                        true
                    }

                    val allGranted = phoneGranted && callLogGranted && receiveSmsGranted && readSmsGranted && notifGranted
                    val statusMap = mapOf(
                        "allGranted" to allGranted,
                        "readPhone" to phoneGranted,
                        "callLog" to callLogGranted,
                        "receiveSms" to receiveSmsGranted,
                        "readSms" to readSmsGranted,
                        "notifications" to notifGranted
                    )
                    result.success(statusMap)
                }

                "requestTelephonyPermissions" -> {
                    val permissionsList = mutableListOf(
                        Manifest.permission.READ_PHONE_STATE,
                        Manifest.permission.READ_CALL_LOG,
                        Manifest.permission.RECEIVE_SMS,
                        Manifest.permission.READ_SMS
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        permissionsList.add(Manifest.permission.POST_NOTIFICATIONS)
                    }

                    pendingPermissionResult = result
                    ActivityCompat.requestPermissions(this, permissionsList.toTypedArray(), PERMISSION_REQUEST_CODE)
                }

                "openMiuiPopupSettings" -> {
                    val opened = tryOpenMiuiPermissionEditor()
                    result.success(opened)
                }

                "triggerFloatingOverlay" -> {
                    try {
                        val number = call.argument<String>("number") ?: "+92 300 9876543"
                        val name = call.argument<String>("name") ?: "🚨 Digital Arrest / CBI Impersonator"
                        val carrier = call.argument<String>("carrier") ?: "Mobilink Jazz Pakistan · International Gateway"
                        val isThreat = call.argument<Boolean>("is_threat") ?: true
                        val riskScore = call.argument<Double>("risk_score") ?: 96.0
                        val isSms = call.argument<Boolean>("is_sms") ?: false
                        val smsText = call.argument<String>("sms_text")

                        val serviceIntent = Intent(this, FloatingCallerOverlayService::class.java).apply {
                            putExtra("number", number)
                            putExtra("name", name)
                            putExtra("carrier", carrier)
                            putExtra("is_threat", isThreat)
                            putExtra("risk_score", riskScore)
                            putExtra("is_sms", isSms)
                            putExtra("sms_text", smsText)
                        }

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            startForegroundService(serviceIntent)
                        } else {
                            startService(serviceIntent)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SERVICE_START_FAILED", e.localizedMessage, null)
                    }
                }

                "dismissFloatingOverlay" -> {
                    try {
                        val dismissIntent = Intent(this, FloatingCallerOverlayService::class.java).setAction("ACTION_DISMISS")
                        startService(dismissIntent)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("DISMISS_FAILED", e.localizedMessage, null)
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            pendingPermissionResult?.success(allGranted)
            pendingPermissionResult = null
        }
    }

    private fun tryOpenMiuiPermissionEditor(): Boolean {
        return try {
            val intent = Intent("miui.intent.action.APP_PERM_EDITOR").apply {
                setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity")
                putExtra("extra_pkgname", packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
            true
        } catch (e1: Exception) {
            try {
                val intent = Intent("miui.intent.action.APP_PERM_EDITOR").apply {
                    setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.AppPermissionsEditorActivity")
                    putExtra("extra_pkgname", packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
                true
            } catch (e2: Exception) {
                try {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                    true
                } catch (e3: Exception) {
                    false
                }
            }
        }
    }
}
