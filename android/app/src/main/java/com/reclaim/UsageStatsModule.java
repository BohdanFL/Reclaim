package com.reclaim;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.content.Intent;
import android.app.Activity;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

public class UsageStatsModule extends ReactContextBaseJavaModule {
    UsageStatsModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "UsageStatsModule";
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    @ReactMethod
    public void getUsageStats(Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) getReactApplicationContext().getSystemService(Context.USAGE_STATS_SERVICE);
            long time = System.currentTimeMillis();
            List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 3600 * 24, time);
            
            WritableArray result = Arguments.createArray();
            if (appList != null) {
                for (UsageStats usageStats : appList) {
                    WritableMap app = Arguments.createMap();
                    app.putString("packageName", usageStats.getPackageName());
                    app.putDouble("totalTimeInForeground", usageStats.getTotalTimeInForeground());
                    result.pushMap(app);
                }
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void openUsageAccessSettings() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
    }
}
