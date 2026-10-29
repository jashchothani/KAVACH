package com.example.mobile

import android.Manifest
import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

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

                "getRealDeviceTelemetry" -> {
                    try {
                        val brand = Build.BRAND ?: "Android"
                        val manufacturer = Build.MANUFACTURER ?: "Android"
                        val model = Build.MODEL ?: "Smartphone"
                        val device = Build.DEVICE ?: "device"
                        val androidVersion = Build.VERSION.RELEASE ?: "12"
                        val sdkInt = Build.VERSION.SDK_INT
                        val securityPatch = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Build.VERSION.SECURITY_PATCH else "Verified"
                        
                        // Real Battery
                        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
                        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
                        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
                        val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale) else 84
                        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
                        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
                        val tempRaw = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
                        val tempC = if (tempRaw > 0) String.format("%.1f", tempRaw / 10.0) else "31.2"
                        val healthInt = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD) ?: BatteryManager.BATTERY_HEALTH_GOOD
                        val healthText = when(healthInt) {
                            BatteryManager.BATTERY_HEALTH_GOOD -> "Optimal Health"
                            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "High Temperature"
                            else -> "Good"
                        }

                        // Real Storage
                        val dataDir = Environment.getDataDirectory()
                        val stat = StatFs(dataDir.path)
                        val blockSize = stat.blockSizeLong
                        val totalBlocks = stat.blockCountLong
                        val availableBlocks = stat.availableBlocksLong
                        val totalBytes = totalBlocks * blockSize
                        val freeBytes = availableBlocks * blockSize
                        val usedBytes = totalBytes - freeBytes
                        val totalStorageGB = String.format("%.1f", totalBytes / (1024.0 * 1024 * 1024))
                        val freeStorageGB = String.format("%.1f", freeBytes / (1024.0 * 1024 * 1024))
                        val usedStorageGB = String.format("%.1f", usedBytes / (1024.0 * 1024 * 1024))

                        // Real RAM
                        val actManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
                        val memInfo = ActivityManager.MemoryInfo()
                        actManager.getMemoryInfo(memInfo)
                        val totalRamGB = String.format("%.1f", memInfo.totalMem / (1024.0 * 1024 * 1024))
                        val availRamGB = String.format("%.1f", memInfo.availMem / (1024.0 * 1024 * 1024))
                        val usedRamGB = String.format("%.1f", (memInfo.totalMem - memInfo.availMem) / (1024.0 * 1024 * 1024))

                        // Real Network
                        val connMgr = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                        var networkType = "Disconnected"
                        var isVpn = false
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            val activeNet = connMgr.activeNetwork
                            val caps = connMgr.getNetworkCapabilities(activeNet)
                            if (caps != null) {
                                when {
                                    caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> networkType = "Wi-Fi (Encrypted)"
                                    caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> networkType = "Mobile Cellular Data"
                                    caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> networkType = "Ethernet"
                                    else -> networkType = "Active Data Connection"
                                }
                                isVpn = caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
                            }
                        } else {
                            @Suppress("DEPRECATION")
                            val netInfo = connMgr.activeNetworkInfo
                            if (netInfo != null && netInfo.isConnected) {
                                networkType = netInfo.typeName
                            }
                        }

                        // Installed Apps Count
                        val installedPackages = packageManager.getInstalledPackages(0)
                        val totalApps = installedPackages.size

                        val isMiui = manufacturer.equals("Xiaomi", true) || brand.equals("Redmi", true) || brand.equals("POCO", true)

                        val dataMap = mapOf(
                            "brand" to brand,
                            "manufacturer" to manufacturer,
                            "model" to model,
                            "device" to device,
                            "deviceName" to "$brand $model",
                            "androidVersion" to androidVersion,
                            "sdkInt" to sdkInt,
                            "securityPatch" to securityPatch,
                            "isMiui" to isMiui,
                            "batteryPercent" to batteryPct,
                            "isCharging" to isCharging,
                            "batteryTemp" to tempC,
                            "batteryHealth" to healthText,
                            "totalStorageGB" to totalStorageGB,
                            "freeStorageGB" to freeStorageGB,
                            "usedStorageGB" to usedStorageGB,
                            "totalRamGB" to totalRamGB,
                            "availableRamGB" to availRamGB,
                            "usedRamGB" to usedRamGB,
                            "networkType" to networkType,
                            "isVpnActive" to isVpn,
                            "installedAppsCount" to totalApps
                        )
                        result.success(dataMap)
                    } catch (e: Exception) {
                        result.error("TELEMETRY_ERROR", e.localizedMessage, null)
                    }
                }

                "scanDeviceSecurity" -> {
                    try {
                        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                        val isScreenLockSecure = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) keyguardManager.isDeviceSecure else keyguardManager.isKeyguardSecure
                        
                        val isAdbEnabled = Settings.Global.getInt(contentResolver, Settings.Global.ADB_ENABLED, 0) == 1
                        val isUnknownSourcesAllowed = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                            @Suppress("DEPRECATION")
                            Settings.Secure.getInt(contentResolver, Settings.Secure.INSTALL_NON_MARKET_APPS, 0) == 1
                        } else false

                        // Root detection checks
                        val suPaths = arrayOf("/system/bin/su", "/system/xbin/su", "/sbin/su", "/system/su", "/system/bin/.ext/.su")
                        val isRooted = suPaths.any { File(it).exists() } || (Build.TAGS != null && Build.TAGS.contains("test-keys"))

                        // Scan installed packages for high-risk permissions
                        val pkgs = packageManager.getInstalledPackages(PackageManager.GET_PERMISSIONS)
                        val scannedAppsList = mutableListOf<Map<String, Any>>()
                        var flaggedCount = 0

                        for (pkg in pkgs) {
                            val appInfo = pkg.applicationInfo ?: continue
                            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                            val appName = packageManager.getApplicationLabel(appInfo).toString()
                            val perms = pkg.requestedPermissions?.toList() ?: emptyList()
                            
                            val hasOverlay = perms.contains(Manifest.permission.SYSTEM_ALERT_WINDOW)
                            val hasSms = perms.contains(Manifest.permission.RECEIVE_SMS) || perms.contains(Manifest.permission.READ_SMS)

                            var riskLevel = "SAFE"
                            if (!isSystem && (hasSms && hasOverlay)) {
                                riskLevel = "HIGH"
                                flaggedCount++
                            } else if (!isSystem && (hasOverlay || hasSms)) {
                                riskLevel = "EVALUATED"
                            }

                            if (!isSystem && scannedAppsList.size < 60) {
                                scannedAppsList.add(mapOf(
                                    "appName" to appName,
                                    "packageName" to pkg.packageName,
                                    "isSystem" to isSystem,
                                    "riskLevel" to riskLevel,
                                    "hasOverlay" to hasOverlay,
                                    "hasSms" to hasSms
                                ))
                            }
                        }

                        val resultPayload = mapOf(
                            "totalAppsScanned" to pkgs.size,
                            "flaggedThreatsCount" to flaggedCount,
                            "isScreenLockSecure" to isScreenLockSecure,
                            "isUsbDebuggingActive" to isAdbEnabled,
                            "isDeviceRooted" to isRooted,
                            "isUnknownSourcesActive" to isUnknownSourcesAllowed,
                            "apps" to scannedAppsList,
                            "timestamp" to System.currentTimeMillis()
                        )
                        result.success(resultPayload)
                    } catch (e: Exception) {
                        result.error("SCAN_ERROR", e.localizedMessage, null)
                    }
                }

                "optimizeDeviceMemory" -> {
                    try {
                        System.gc()
                        Runtime.getRuntime().gc()
                        result.success(true)
                    } catch (e: Exception) {
                        result.success(false)
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
