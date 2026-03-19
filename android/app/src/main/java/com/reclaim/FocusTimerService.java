package com.reclaim;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import android.content.Context;
import android.util.Log;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class FocusTimerService extends Service {
    private static final String CHANNEL_ID = "FocusTimer";
    private static final int NOTIFICATION_ID = 1;
    private static final String TAG = "FocusTimerService";
    
    private CountDownTimer timer;
    private long timeLeftInMillis;
    private boolean isTimerRunning = false;
    private boolean isPaused = false;
    private String currentSessionName;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        acquireWakeLock();
        Log.d(TAG, "Service created");
    }

    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Reclaim::FocusTimerWakeLock"
        );
        wakeLock.acquire();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "Received action: " + action);
            if (action != null) {
                switch (action) {
                    case "START":
                        long durationMinutes = intent.getLongExtra("duration", 0);
                        String sessionName = intent.getStringExtra("sessionName");
                        Log.d(TAG, "Starting timer for " + durationMinutes + " minutes");
                        if (durationMinutes > 0 && !isTimerRunning) {
                            startTimer(durationMinutes * 60 * 1000, sessionName);
                        }
                        break;
                    case "PAUSE":
                        pauseTimer();
                        break;
                    case "RESUME":
                        resumeTimer();
                        break;
                    case "STOP":
                        stopTimerService();
                        break;
                }
            }
        }
        return START_STICKY;
    }

    private void startTimer(long durationMillis, String sessionName) {
        timeLeftInMillis = durationMillis;
        currentSessionName = sessionName;
        isTimerRunning = true;
        isPaused = false;
        createTimer();
        timer.start();
        
        startForeground(NOTIFICATION_ID, buildNotification("Starting Focus Session...", sessionName));
        Log.d(TAG, "Timer started with duration: " + durationMillis + "ms");
    }

    private void createTimer() {
        if (timer != null) {
            timer.cancel();
        }

        timer = new CountDownTimer(timeLeftInMillis, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                timeLeftInMillis = millisUntilFinished;
                updateNotification(formatTime(millisUntilFinished), currentSessionName);
                
                WritableMap params = Arguments.createMap();
                params.putDouble("timeLeft", millisUntilFinished / 1000.0);
                FocusTimerModule.sendEvent(FocusTimerModule.EVENT_TIMER_TICK, params);
                Log.d(TAG, "Timer tick: " + millisUntilFinished / 1000.0 + "s remaining");
            }

            @Override
            public void onFinish() {
                isTimerRunning = false;
                stopTimerService();
                
                WritableMap params = Arguments.createMap();
                FocusTimerModule.sendEvent(FocusTimerModule.EVENT_TIMER_FINISH, params);
                Log.d(TAG, "Timer finished");
            }
        };
    }

    private void pauseTimer() {
        if (timer != null && isTimerRunning) {
            timer.cancel();
            isPaused = true;
            updateNotification("PAUSED - " + formatTime(timeLeftInMillis), currentSessionName);
            
            WritableMap params = Arguments.createMap();
            params.putBoolean("isPaused", true);
            FocusTimerModule.sendEvent(FocusTimerModule.EVENT_TIMER_STATE, params);
            Log.d(TAG, "Timer paused");
        }
    }

    private void resumeTimer() {
        if (isPaused && timeLeftInMillis > 0) {
            isPaused = false;
            createTimer();
            timer.start();
            
            WritableMap params = Arguments.createMap();
            params.putBoolean("isPaused", false);
            FocusTimerModule.sendEvent(FocusTimerModule.EVENT_TIMER_STATE, params);
            Log.d(TAG, "Timer resumed");
        }
    }

    private void stopTimerService() {
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
        isTimerRunning = false;
        isPaused = false;
        stopForeground(true);
        stopSelf();
        Log.d(TAG, "Timer service stopped");
    }

    private String formatTime(long millis) {
        long minutes = (millis / 1000) / 60;
        long seconds = (millis / 1000) % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Focus Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows focus session progress");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private void updateNotification(String time, String sessionName) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification(time, sessionName));
    }

    private Notification buildNotification(String time, String sessionName) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        String title = sessionName != null ? sessionName : "Focus Session";
        String status = isPaused ? "PAUSED" : "Active";
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(status + " - Time Remaining: " + time)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (timer != null) {
            timer.cancel();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        isTimerRunning = false;
        isPaused = false;
        Log.d(TAG, "Service destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
} 