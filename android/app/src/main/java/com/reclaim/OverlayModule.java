package com.reclaim;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;
import android.widget.Button;
import android.graphics.PixelFormat;
import android.content.Context;
import android.view.ViewGroup.LayoutParams;
import android.app.usage.UsageStatsManager;
import android.app.usage.UsageEvents;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class OverlayModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private View overlayView;
    private WindowManager windowManager;
    private String targetPackageName;
    private Handler handler;
    private Runnable checkForegroundApp;
    private boolean isMonitoring = false;
    private boolean isLimitExceeded = false;
    private boolean warningDismissed = false;

    public OverlayModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        this.handler = new Handler(Looper.getMainLooper());
    }

    @NonNull
    @Override
    public String getName() {
        return "OverlayModule";
    }

    private String getForegroundApp() {
        UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        UsageEvents usageEvents = usageStatsManager.queryEvents(time - 1000 * 60, time);
        UsageEvents.Event event = new UsageEvents.Event();
        String currentApp = null;
        
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                currentApp = event.getPackageName();
            }
        }
        return currentApp;
    }

    @ReactMethod
    public void startMonitoring(String packageName, boolean isExceeded) {
        targetPackageName = packageName;
        isLimitExceeded = isExceeded;
        warningDismissed = false;
        
        if (!isMonitoring) {
            isMonitoring = true;
            checkForegroundApp = new Runnable() {
                @Override
                public void run() {
                    String currentApp = getForegroundApp();
                    if (currentApp != null && currentApp.equals(targetPackageName)) {
                        if (isLimitExceeded) {
                            showBlockingOverlay();
                        } else if (!warningDismissed) {
                            showWarningOverlay();
                        }
                    } else {
                        hideOverlay();
                    }
                    if (isMonitoring) {
                        handler.postDelayed(this, 1000);
                    }
                }
            };
            handler.post(checkForegroundApp);
        }
    }

    @ReactMethod
    public void stopMonitoring() {
        isMonitoring = false;
        handler.removeCallbacks(checkForegroundApp);
        hideOverlay();
    }

    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        try {
            boolean hasPermission = Settings.canDrawOverlays(reactContext);
            promise.resolve(hasPermission);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + reactContext.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        }
    }

    private void showBlockingOverlay() {
        if (!Settings.canDrawOverlays(reactContext)) {
            return;
        }

        reactContext.runOnUiQueueThread(() -> {
            if (overlayView != null) {
                return;
            }

            LayoutInflater inflater = LayoutInflater.from(reactContext);
            overlayView = inflater.inflate(R.layout.warning_overlay, null);

            TextView messageText = overlayView.findViewById(R.id.warningMessage);
            messageText.setText("You have reached your time limit for today");

            Button closeButton = overlayView.findViewById(R.id.closeButton);
            closeButton.setText("Close App");
            closeButton.setOnClickListener(v -> {
                // Закриваємо додаток
                Intent startMain = new Intent(Intent.ACTION_MAIN);
                startMain.addCategory(Intent.CATEGORY_HOME);
                startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(startMain);
                hideOverlay();
            });

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                WindowManager.LayoutParams.FLAG_FULLSCREEN |
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            );

            params.gravity = Gravity.CENTER;
            
            try {
                windowManager.addView(overlayView, params);
                
                // Make the overlay receive all touch events
                overlayView.setOnTouchListener((v, event) -> {
                    // Block all touch events
                    return true;
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void showWarningOverlay() {
        if (!Settings.canDrawOverlays(reactContext)) {
            return;
        }

        reactContext.runOnUiQueueThread(() -> {
            if (overlayView != null) {
                return;
            }

            LayoutInflater inflater = LayoutInflater.from(reactContext);
            overlayView = inflater.inflate(R.layout.warning_overlay, null);

            TextView messageText = overlayView.findViewById(R.id.warningMessage);
            messageText.setText("You are approaching your time limit for this app");

            Button closeButton = overlayView.findViewById(R.id.closeButton);
            closeButton.setText("Got it");
            closeButton.setOnClickListener(v -> {
                warningDismissed = true;
                hideOverlay();
            });

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            );

            params.gravity = Gravity.CENTER;
            
            try {
                windowManager.addView(overlayView, params);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void hideOverlay() {
        reactContext.runOnUiQueueThread(() -> {
            if (overlayView != null) {
                try {
                    windowManager.removeView(overlayView);
                } catch (Exception e) {
                    e.printStackTrace();
                }
                overlayView = null;
            }
        });
    }

    @ReactMethod
    public void showWarningOverlay(String packageName, boolean isExceeded) {
        startMonitoring(packageName, isExceeded);
    }

    @ReactMethod
    public void hideWarningOverlay() {
        stopMonitoring();
    }
} 