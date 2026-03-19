package com.reclaim;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import android.content.Context;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;
import android.content.SharedPreferences;

public class FocusTimerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "FocusTimerModule";
    private final ReactApplicationContext reactContext;
    private static ReactApplicationContext staticReactContext;
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_DELAY_MS = 1000; // 1 second

    public static final String EVENT_TIMER_TICK = "focus_timer_tick";
    public static final String EVENT_TIMER_FINISH = "focus_timer_finish";
    public static final String EVENT_TIMER_STATE = "focus_timer_state";

    private static final String CHANNEL_ID = "FocusTimer";
    private static final int NOTIFICATION_ID = 1;

    private CountDownTimer timer;
    private long timeLeftInMillis;
    private boolean isTimerRunning = false;
    private boolean isPaused = false;
    private String currentSessionName;

    public FocusTimerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        staticReactContext = reactContext;
        createNotificationChannel();
    }

    public static ReactApplicationContext getReactContext() {
        return staticReactContext;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Focus Timer",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows focus session progress");
            NotificationManager manager = reactContext.getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private void updateNotification(String time, String sessionName) {
        NotificationManager manager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification(time, sessionName));
    }

    private Notification buildNotification(String time, String sessionName) {
        Intent notificationIntent = new Intent(reactContext, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            reactContext, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        String title = sessionName != null ? sessionName : "Focus Session";
        String status = isPaused ? "PAUSED" : "Active";
        
        return new NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(status + " - Time Remaining: " + time)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .build();
    }

    private String formatTime(long millis) {
        long minutes = (millis / 1000) / 60;
        long seconds = (millis / 1000) % 60;
        return String.format("%02d:%02d", minutes, seconds);
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
                sendEvent(EVENT_TIMER_TICK, params);
                Log.d(TAG, "Timer tick: " + millisUntilFinished / 1000.0 + "s remaining");
            }

            @Override
            public void onFinish() {
                isTimerRunning = false;
                stopTimerInternal();
                
                WritableMap params = Arguments.createMap();
                sendEvent(EVENT_TIMER_FINISH, params);
                Log.d(TAG, "Timer finished");
            }
        };
    }

    private void stopTimerInternal() {
        try {
            Intent intent = new Intent(reactContext, FocusTimerService.class);
            intent.setAction("STOP");
            reactContext.startService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error in stopTimerInternal: " + e.getMessage());
        }
    }

    public static void sendEvent(String eventName, WritableMap params) {
        sendEventWithRetry(eventName, params, 0);
    }

    private static void sendEventWithRetry(final String eventName, final WritableMap params, final int attempt) {
        try {
            ReactApplicationContext context = staticReactContext;
                
            if (context != null) {
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
                Log.d(TAG, "Event sent: " + eventName);
            } else {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    Log.w(TAG, "ReactContext is null, retrying in " + RETRY_DELAY_MS + "ms (attempt " + (attempt + 1) + "/" + MAX_RETRY_ATTEMPTS + ")");
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        sendEventWithRetry(eventName, params, attempt + 1);
                    }, RETRY_DELAY_MS);
                } else {
                    Log.e(TAG, "Failed to send event after " + MAX_RETRY_ATTEMPTS + " attempts: " + eventName);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending event: " + e.getMessage());
        }
    }

    @Override
    public String getName() {
        return "FocusTimerModule";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("TIMER_TICK_EVENT", EVENT_TIMER_TICK);
        constants.put("TIMER_FINISH_EVENT", EVENT_TIMER_FINISH);
        constants.put("TIMER_STATE_EVENT", EVENT_TIMER_STATE);
        return constants;
    }

    @ReactMethod
    public void startTimer(int durationMinutes, String sessionName, Promise promise) {
        try {
            long durationMillis = durationMinutes * 60 * 1000L;
            Log.i(TAG, String.format("Starting timer for %d minutes with session: %s", durationMinutes, sessionName));

            // Get current blocked apps list and update AppBlockerService
            SharedPreferences prefs = reactContext.getSharedPreferences("AppBlockerPrefs", Context.MODE_PRIVATE);
            String blockedAppsJson = prefs.getString("blockedApps", "[]");
            Intent updateIntent = new Intent("com.reclaim.UPDATE_BLOCKED_APPS");
            updateIntent.putExtra("apps", blockedAppsJson);
            reactContext.sendBroadcast(updateIntent);
            Log.d(TAG, "Sent broadcast to update blocked apps: " + blockedAppsJson);

            // Start the focus timer service
            Intent intent = new Intent(reactContext, FocusTimerService.class);
            intent.putExtra("duration", (long) durationMinutes);
            intent.putExtra("sessionName", sessionName);
            intent.setAction("START");
            reactContext.startService(intent);

            // Start the blocking session
            AppBlockerService.startSession(durationMillis);
            Log.d(TAG, "App blocking session started");

            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error starting timer: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopTimer(Promise promise) {
        try {
            Log.i(TAG, "Stopping timer and blocking session");
            
            // Stop the focus timer service
            Intent intent = new Intent(reactContext, FocusTimerService.class);
            intent.setAction("STOP");
            reactContext.startService(intent);

            // Stop the blocking session
            AppBlockerService.stopSession();
            Log.d(TAG, "App blocking session stopped");

            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping timer: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void pauseTimer(Promise promise) {
        try {
            Log.i(TAG, "Pausing timer");
            
            Intent intent = new Intent(reactContext, FocusTimerService.class);
            intent.setAction("PAUSE");
            reactContext.startService(intent);

            // Pause the blocking session (optional - depending on your requirements)
            AppBlockerService.pauseSession();

            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error pausing timer: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void resumeTimer(Promise promise) {
        try {
            Log.i(TAG, "Resuming timer");
            
            Intent intent = new Intent(reactContext, FocusTimerService.class);
            intent.setAction("RESUME");
            reactContext.startService(intent);

            // Resume the blocking session (optional - depending on your requirements)
            AppBlockerService.resumeSession();

            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error resuming timer: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateBlockedApps(String appsJson, Promise promise) {
        try {
            Log.i(TAG, "Updating blocked apps list");
            
            // Send broadcast to update blocked apps
            Intent intent = new Intent("com.reclaim.UPDATE_BLOCKED_APPS");
            intent.putExtra("apps", appsJson);
            reactContext.sendBroadcast(intent);
            
            // Parse and update blocked apps in AppBlockerService
            JSONArray jsonArray = new JSONArray(appsJson);
            Set<String> blockedPackages = new HashSet<>();
            
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject app = jsonArray.getJSONObject(i);
                if (app.getBoolean("isActive")) {
                    String packageName = app.getString("packageName");
                    blockedPackages.add(packageName);
                    Log.d(TAG, "Added to block list: " + packageName);
                }
            }
            
            AppBlockerService.setBlockedPackages(blockedPackages);
            Log.i(TAG, "Updated blocked apps list. Total apps: " + blockedPackages.size());
            
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "Error updating blocked apps: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for React Native event emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for React Native event emitter
    }
} 