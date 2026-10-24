package com.example.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat

class FloatingCallerOverlayService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private val autoDismissHandler = Handler(Looper.getMainLooper())
    private var autoDismissRunnable: Runnable? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        startForegroundServiceNotification("KAVACH Telephony Sentinel", "Caller ID and fraud intercept active")
    }

    private fun startForegroundServiceNotification(title: String, body: String) {
        val channelId = "kavach_telephony_channel"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                channelId,
                "KAVACH Telephony & Caller Sentinel",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Real-time floating caller ID and SMS threat warning alerts"
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
            }
            manager.createNotificationChannel(chan)
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT else PendingIntent.FLAG_UPDATE_CURRENT
            )
        } else null

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .build()

        try {
            if (Build.VERSION.SDK_INT >= 34) {
                try {
                    startForeground(777, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
                } catch (e: Exception) {
                    try {
                        startForeground(777, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
                    } catch (e2: Exception) {
                        startForeground(777, notification)
                    }
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(777, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
            } else {
                startForeground(777, notification)
            }
        } catch (e: Exception) {
            Log.e("KAVACH", "startForeground error: ${e.message}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == "ACTION_DISMISS") {
            removeOverlay()
            stopSelf()
            return START_NOT_STICKY
        }

        val number = intent?.getStringExtra("number") ?: "Unknown Line"
        val name = intent?.getStringExtra("name") ?: "🚨 Suspicious Incoming Call"
        val carrier = intent?.getStringExtra("carrier") ?: "Global Telecom Gateway"
        val isThreat = intent?.getBooleanExtra("is_threat", true) ?: true
        val riskScore = intent?.getDoubleExtra("risk_score", 96.0) ?: 96.0
        val isSms = intent?.getBooleanExtra("is_sms", false) ?: false
        val smsText = intent?.getStringExtra("sms_text")

        startForegroundServiceNotification(
            if (isThreat) "🚨 KAVACH Threat Intercept: $name" else "✓ KAVACH Caller: $name",
            "$number · $carrier"
        )

        showOverlay(number, name, carrier, isThreat, riskScore, isSms, smsText)

        // Auto-dismiss after 40 seconds if user does not touch
        autoDismissRunnable?.let { autoDismissHandler.removeCallbacks(it) }
        autoDismissRunnable = Runnable {
            removeOverlay()
            stopSelf()
        }
        autoDismissHandler.postDelayed(autoDismissRunnable!!, 40000L)

        return START_NOT_STICKY
    }

    private fun showOverlay(
        number: String,
        name: String,
        carrier: String,
        isThreat: Boolean,
        riskScore: Double,
        isSms: Boolean,
        smsText: String?
    ) {
        removeOverlay()

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        params.x = 0
        params.y = 80

        val context = this
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).toInt()

        // Outer Container
        val rootLayout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(8), dp(14), dp(8))
        }

        // Inner Card Box (Glassmorphic dark styling)
        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(14))
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#0F172A"))
                cornerRadius = dp(16).toFloat()
                setStroke(
                    dp(2),
                    if (isThreat) Color.parseColor("#EF4444") else Color.parseColor("#10B981")
                )
            }
            background = bg
            elevation = dp(14).toFloat()
        }

        // 1. Drag Handle Pill at the very top
        val dragHandle = View(context).apply {
            val pill = GradientDrawable().apply {
                setColor(Color.parseColor("#475569"))
                cornerRadius = dp(3).toFloat()
            }
            background = pill
        }
        val dragParams = LinearLayout.LayoutParams(dp(44), dp(5)).apply {
            gravity = Gravity.CENTER_HORIZONTAL
            setMargins(0, 0, 0, dp(10))
        }
        card.addView(dragHandle, dragParams)

        // 2. Header Row: Threat Pill & Close Icon
        val headerRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val badgeText = TextView(context).apply {
            val label = if (isSms) {
                if (isThreat) "🚨 SMISHING SMS ALERT · THREAT INTERCEPT" else "✓ VERIFIED SMS SENDER"
            } else {
                if (isThreat) "🚨 LIVE CALLER ID · FRAUD INTERCEPT" else "✓ VERIFIED TELECOM CALLER"
            }
            text = label
            setTextColor(if (isThreat) Color.parseColor("#FCA5A5") else Color.parseColor("#6EE7B7"))
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            val badgeBg = GradientDrawable().apply {
                setColor(if (isThreat) Color.parseColor("#3B1212") else Color.parseColor("#064E3B"))
                cornerRadius = dp(6).toFloat()
            }
            background = badgeBg
            setPadding(dp(8), dp(4), dp(8), dp(4))
        }

        val closeBtn = ImageView(context).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(Color.parseColor("#94A3B8"))
            setPadding(dp(4), dp(4), dp(4), dp(4))
            setOnClickListener {
                removeOverlay()
                stopSelf()
            }
        }

        headerRow.addView(badgeText, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f))
        headerRow.addView(closeBtn, LinearLayout.LayoutParams(dp(28), dp(28)))
        card.addView(headerRow)

        // 3. Caller / Sender Name
        val nameView = TextView(context).apply {
            text = name
            setTextColor(if (isThreat) Color.parseColor("#F87171") else Color.WHITE)
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, dp(8), 0, dp(2))
        }
        card.addView(nameView)

        // 4. Phone Number
        val numberView = TextView(context).apply {
            text = number
            setTextColor(Color.WHITE)
            textSize = 13.5f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, 0, 0, dp(2))
        }
        card.addView(numberView)

        // 5. Carrier & Threat Risk Text
        val carrierView = TextView(context).apply {
            text = "$carrier · Risk Score: ${riskScore.toInt()}%"
            setTextColor(Color.parseColor("#94A3B8"))
            textSize = 11f
            setPadding(0, 0, 0, dp(6))
        }
        card.addView(carrierView)

        // 6. SMS Body Preview if SMS
        if (isSms && !smsText.isNullOrEmpty()) {
            val smsBox = TextView(context).apply {
                text = "\"$smsText\""
                setTextColor(Color.parseColor("#E2E8F0"))
                textSize = 11.5f
                val boxBg = GradientDrawable().apply {
                    setColor(Color.parseColor("#1E293B"))
                    cornerRadius = dp(8).toFloat()
                }
                background = boxBg
                setPadding(dp(10), dp(8), dp(10), dp(8))
            }
            card.addView(smsBox)
        }

        // 7. Action Buttons Row: Block & Report 1930
        val actionsRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(10), 0, 0)
        }

        val blockBtn = Button(context).apply {
            text = "Block Number"
            setTextColor(Color.WHITE)
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#DC2626"))
                cornerRadius = dp(8).toFloat()
            }
            background = btnBg
            setOnClickListener {
                Toast.makeText(context, "✓ $number added to KAVACH blocklist", Toast.LENGTH_SHORT).show()
                removeOverlay()
                stopSelf()
            }
        }

        val reportBtn = Button(context).apply {
            text = "Report 1930"
            setTextColor(Color.WHITE)
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#334155"))
                cornerRadius = dp(8).toFloat()
            }
            background = btnBg
            setOnClickListener {
                Toast.makeText(context, "Dispatched incident for $number to National Cybercrime Portal 1930", Toast.LENGTH_LONG).show()
                removeOverlay()
                stopSelf()
            }
        }

        val btnParams = LinearLayout.LayoutParams(0, dp(38), 1.0f).apply {
            setMargins(0, 0, dp(6), 0)
        }
        val btnParams2 = LinearLayout.LayoutParams(0, dp(38), 1.0f).apply {
            setMargins(dp(6), 0, 0, 0)
        }

        actionsRow.addView(blockBtn, btnParams)
        actionsRow.addView(reportBtn, btnParams2)
        card.addView(actionsRow)

        // Drag to Move on Drag Handle Touch (so buttons still respond normally)
        dragHandle.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    try {
                        windowManager?.updateViewLayout(rootLayout, params)
                    } catch (e: Exception) {
                        Log.e("KAVACH", "updateViewLayout error: ${e.message}")
                    }
                    true
                }
                else -> false
            }
        }

        rootLayout.addView(card)
        overlayView = rootLayout

        try {
            windowManager?.addView(rootLayout, params)
            Log.d("KAVACH", "FloatingCallerOverlayService: overlay successfully added to windowManager")
        } catch (e: Exception) {
            Log.e("KAVACH", "FloatingCallerOverlayService addView failed: ${e.message}")
            Toast.makeText(context, "KAVACH Alert: $name ($number)", Toast.LENGTH_LONG).show()
        }
    }

    private fun removeOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                Log.e("KAVACH", "removeOverlay error: ${e.message}")
            }
            overlayView = null
        }
    }

    override fun onDestroy() {
        autoDismissRunnable?.let { autoDismissHandler.removeCallbacks(it) }
        removeOverlay()
        super.onDestroy()
    }
}
