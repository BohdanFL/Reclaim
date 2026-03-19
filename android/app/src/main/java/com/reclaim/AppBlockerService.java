package com.reclaim;

import android.accessibilityservice.AccessibilityService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.view.accessibility.AccessibilityEvent;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;
import android.util.Log;

public class AppBlockerService extends AccessibilityService {
    private static final String TAG = "AppBlockerService";
    private static Set<String> blockedPackages = new HashSet<>();
    private static boolean isSessionActive = false;
    private static boolean isPaused = false;
    private static long sessionEndTime = 0;
    private static long pausedTimeLeft = 0;
    private String currentApp = "";
    private Handler mainHandler;
    private static final String BLOCK_SCREEN_ACTIVITY = "com.reclaim.BlockScreenActivity";

    private BroadcastReceiver updateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.reclaim.UPDATE_BLOCKED_APPS".equals(intent.getAction())) {
                try {
                    String appsJson = intent.getStringExtra("apps");
                    JSONArray jsonArray = new JSONArray(appsJson);
                    Log.i(TAG, "Updating blocked apps list");
                    blockedPackages.clear();
                    for (int i = 0; i < jsonArray.length(); i++) {
                        JSONObject app = jsonArray.getJSONObject(i);
                        if (app.getBoolean("isActive")) {
                            String packageName = app.getString("packageName");
                            blockedPackages.add(packageName);
                            Log.d(TAG, "Added to blocked list: " + packageName);
                        }
                    }
                    Log.i(TAG, "Current blocked packages: " + blockedPackages.toString());
                } catch (Exception e) {
                    Log.e(TAG, "Error updating blocked apps: " + e.getMessage(), e);
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "AppBlockerService created");
        mainHandler = new Handler(Looper.getMainLooper());
        registerReceiver(updateReceiver, new IntentFilter("com.reclaim.UPDATE_BLOCKED_APPS"));
        Log.d(TAG, "Registered UPDATE_BLOCKED_APPS receiver");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "AppBlockerService destroyed");
        unregisterReceiver(updateReceiver);
        Log.d(TAG, "Unregistered UPDATE_BLOCKED_APPS receiver");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String packageName = event.getPackageName() != null ? event.getPackageName().toString() : "";
            
            // Debug logging for session state
            Log.d(TAG, String.format("Window changed to package: %s", packageName));
            Log.d(TAG, String.format("Session state - Active: %b, Paused: %b", isSessionActive, isPaused));
            Log.d(TAG, String.format("Current blocked packages: %s", blockedPackages.toString()));
            
            // First check if session is active and not paused
            if (!isSessionActive() || isPaused) {
                Log.d(TAG, String.format("No blocking: Session active=%b, isPaused=%b", isSessionActive, isPaused));
                return;
            }

            // Then check if the package is in the blocked list
            if (blockedPackages.contains(packageName)) {
                long timeLeft = getTimeLeft();
                if (timeLeft > 0) {
                    String appName = getAppName(packageName);
                    Log.i(TAG, String.format("Blocking access to %s (%s). Time left in session: %d ms", 
                        appName, packageName, timeLeft));
                    
                    // Launch block screen
                    Intent intent = new Intent(this, BlockScreenActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    intent.putExtra("blockedAppName", appName);
                    startActivity(intent);
                } else {
                    Log.i(TAG, "Session time expired, stopping session");
                    stopSession();
                }
            }
        }
    }

    private String getAppName(String packageName) {
        try {
            String appName = getPackageManager().getApplicationInfo(packageName, 0)
                .loadLabel(getPackageManager()).toString();
            Log.v(TAG, String.format("Resolved app name for %s: %s", packageName, appName));
            return appName;
        } catch (Exception e) {
            Log.w(TAG, "Could not resolve app name for: " + packageName, e);
            return packageName;
        }
    }

    public static void setBlockedPackages(Set<String> packages) {
        Log.i(TAG, "Updating blocked packages list. New packages: " + packages.toString());
        blockedPackages = new HashSet<>(packages);
    }

    public static void startSession(long durationMillis) {
        isSessionActive = true;
        isPaused = false;
        sessionEndTime = System.currentTimeMillis() + durationMillis;
        pausedTimeLeft = 0;
        Log.i(TAG, String.format("Starting new focus session. Duration: %d ms, End time: %d", 
            durationMillis, sessionEndTime));
        Log.d(TAG, "Current blocked packages at session start: " + blockedPackages.toString());
    }

    public static void stopSession() {
        if (isSessionActive) {
            Log.i(TAG, "Stopping focus session");
            isSessionActive = false;
            isPaused = false;
            sessionEndTime = 0;
            pausedTimeLeft = 0;
        }
    }

    public static void pauseSession() {
        if (isSessionActive && !isPaused) {
            long timeLeft = getTimeLeft();
            if (timeLeft > 0) {
                isPaused = true;
                pausedTimeLeft = timeLeft;
                Log.i(TAG, String.format("Pausing focus session. Time left: %d ms", timeLeft));
            } else {
                stopSession();
            }
        }
    }

    public static void resumeSession() {
        if (isSessionActive && isPaused && pausedTimeLeft > 0) {
            isPaused = false;
            sessionEndTime = System.currentTimeMillis() + pausedTimeLeft;
            pausedTimeLeft = 0;
            Log.i(TAG, String.format("Resuming focus session. Will end at: %d", sessionEndTime));
        }
    }

    public static boolean isSessionActive() {
        if (!isSessionActive) return false;
        if (isPaused) return true;  // Paused session is still considered active
        
        long timeLeft = getTimeLeft();
        if (timeLeft <= 0) {
            stopSession();
            return false;
        }
        return true;
    }

    public static long getTimeLeft() {
        if (!isSessionActive) return 0;
        if (isPaused) return pausedTimeLeft;
        long timeLeft = sessionEndTime - System.currentTimeMillis();
        return Math.max(0, timeLeft);
    }

    public static boolean isPaused() {
        return isPaused;
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "AppBlockerService interrupted");
    }

    @Override
    protected void onServiceConnected() {
        Log.i(TAG, "AppBlockerService connected and ready");
    }
} 