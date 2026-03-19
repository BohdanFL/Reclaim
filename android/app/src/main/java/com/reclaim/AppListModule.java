package com.reclaim;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.util.Log;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

public class AppListModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "AppListModule";
    private static final String PREFS_NAME = "AppBlockerPrefs";
    private static final String BLOCKED_APPS_KEY = "blockedApps";

    public AppListModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AppListModule";
    }

    private String convertDrawableToBase64(Drawable drawable) {
        try {
            Bitmap bitmap;
            if (drawable instanceof BitmapDrawable) {
                bitmap = ((BitmapDrawable) drawable).getBitmap();
            } else {
                bitmap = Bitmap.createBitmap(
                    drawable.getIntrinsicWidth(),
                    drawable.getIntrinsicHeight(),
                    Bitmap.Config.ARGB_8888
                );
                Canvas canvas = new Canvas(bitmap);
                drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                drawable.draw(canvas);
            }

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.DEFAULT);
        } catch (Exception e) {
            Log.e(TAG, "Error converting drawable to base64", e);
            return "";
        }
    }

    private void saveBlockedApps(Set<String> blockedApps) {
        try {
            JSONArray jsonArray = new JSONArray();
            for (String packageName : blockedApps) {
                JSONObject app = new JSONObject();
                app.put("packageName", packageName);
                app.put("isActive", true);
                jsonArray.put(app);
            }

            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString(BLOCKED_APPS_KEY, jsonArray.toString());
            editor.apply();

            // Оновлюємо AppBlockerService через broadcast
            Intent intent = new Intent("com.reclaim.UPDATE_BLOCKED_APPS");
            intent.putExtra("apps", jsonArray.toString());
            reactContext.sendBroadcast(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error saving blocked apps", e);
        }
    }

    private Set<String> getBlockedApps() {
        Set<String> blockedApps = new HashSet<>();
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String jsonStr = prefs.getString(BLOCKED_APPS_KEY, "[]");
            JSONArray jsonArray = new JSONArray(jsonStr);

            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject app = jsonArray.getJSONObject(i);
                if (app.getBoolean("isActive")) {
                    blockedApps.add(app.getString("packageName"));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading blocked apps", e);
        }
        return blockedApps;
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray installedApps = Arguments.createArray();
            String ownPackageName = reactContext.getPackageName();
            Set<String> blockedApps = getBlockedApps();

            for (ApplicationInfo packageInfo : packages) {
                // Skip system apps and Reclaim itself
                if ((packageInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0 
                    && !packageInfo.packageName.equals(ownPackageName)) {
                    WritableMap appInfo = Arguments.createMap();
                    appInfo.putString("packageName", packageInfo.packageName);
                    appInfo.putString("appName", pm.getApplicationLabel(packageInfo).toString());
                    appInfo.putBoolean("isBlocked", blockedApps.contains(packageInfo.packageName));
                    
                    // Get and convert app icon to base64
                    try {
                        Drawable icon = pm.getApplicationIcon(packageInfo.packageName);
                        String base64Icon = convertDrawableToBase64(icon);
                        appInfo.putString("icon", base64Icon);
                    } catch (Exception e) {
                        Log.e(TAG, "Error getting icon for " + packageInfo.packageName, e);
                        appInfo.putString("icon", "");
                    }

                    installedApps.pushMap(appInfo);
                }
            }

            promise.resolve(installedApps);
        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps", e);
            promise.reject("ERROR", "Error getting installed apps: " + e.getMessage());
        }
    }

    @ReactMethod
    public void blockApp(String packageName, Promise promise) {
        try {
            Set<String> blockedApps = getBlockedApps();
            blockedApps.add(packageName);
            saveBlockedApps(blockedApps);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error blocking app", e);
            promise.reject("ERROR", "Error blocking app: " + e.getMessage());
        }
    }

    @ReactMethod
    public void unblockApp(String packageName, Promise promise) {
        try {
            Set<String> blockedApps = getBlockedApps();
            blockedApps.remove(packageName);
            saveBlockedApps(blockedApps);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error unblocking app", e);
            promise.reject("ERROR", "Error unblocking app: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isAppBlocked(String packageName, Promise promise) {
        try {
            Set<String> blockedApps = getBlockedApps();
            promise.resolve(blockedApps.contains(packageName));
        } catch (Exception e) {
            Log.e(TAG, "Error checking app block status", e);
            promise.reject("ERROR", "Error checking app block status: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getBlockedAppsList(Promise promise) {
        try {
            Set<String> blockedApps = getBlockedApps();
            WritableArray result = Arguments.createArray();
            
            PackageManager pm = reactContext.getPackageManager();
            for (String packageName : blockedApps) {
                try {
                    ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
                    WritableMap app = Arguments.createMap();
                    app.putString("packageName", packageName);
                    app.putString("appName", pm.getApplicationLabel(appInfo).toString());
                    result.pushMap(app);
                } catch (PackageManager.NameNotFoundException e) {
                    // Пропускаємо видалені додатки
                    continue;
                }
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting blocked apps list", e);
            promise.reject("ERROR", "Error getting blocked apps list: " + e.getMessage());
        }
    }
} 