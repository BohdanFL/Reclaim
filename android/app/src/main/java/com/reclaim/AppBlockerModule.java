package com.reclaim;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.provider.Settings;
import android.view.accessibility.AccessibilityEvent;
import android.app.Activity;
import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AppBlockerModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AppBlockerModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AppBlockerModule";
    }

    @ReactMethod
    public void checkAccessibilityPermission(Promise promise) {
        try {
            String service = reactContext.getPackageName() + "/com.reclaim.AppBlockerService";
            int enabled = Settings.Secure.getInt(
                reactContext.getContentResolver(),
                Settings.Secure.ACCESSIBILITY_ENABLED
            );
            
            if (enabled == 1) {
                String enabledServices = Settings.Secure.getString(
                    reactContext.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                );
                
                if (enabledServices != null && enabledServices.contains(service)) {
                    promise.resolve(true);
                    return;
                }
            }
            promise.resolve(false);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void openAccessibilitySettings() {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void updateBlockedApps(String apps) {
        // Send blocked apps list to service
        Intent intent = new Intent("com.reclaim.UPDATE_BLOCKED_APPS");
        intent.putExtra("apps", apps);
        reactContext.sendBroadcast(intent);
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
} 