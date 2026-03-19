package com.reclaim;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.app.AppOpsManager;
import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Calendar;
import java.util.Set;
import java.util.HashSet;
import java.util.Arrays;
import android.app.usage.UsageEvents;

public class UsageStatsModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private Set<String> launcherPackages;
    private Set<String> allowedSystemApps;
    private static final String TAG = "UsageStatsModule";
    private final UsageStatsManager usageStatsManager;
    private final PackageManager packageManager;

    UsageStatsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.launcherPackages = getLauncherPackages();
        this.allowedSystemApps = new HashSet<>(Arrays.asList(
            "com.android.camera",
            "com.android.camera2",
            "com.google.android.GoogleCamera",
            "com.sec.android.app.camera",
            "com.huawei.camera",
            "com.android.deskclock",
            "com.google.android.deskclock",
            "com.sec.android.app.clockpackage",
            "com.android.calculator",
            "com.google.android.calculator",
            "com.sec.android.app.calculator",
            "com.android.calendar",
            "com.google.android.calendar",
            "com.samsung.android.calendar",
            "com.android.contacts",
            "com.google.android.contacts",
            "com.samsung.android.contacts",
            "com.android.gallery",
            "com.google.android.apps.photos",
            "com.sec.android.gallery3d",
            "com.android.music",
            "com.google.android.music",
            "com.sec.android.app.music",
            "com.google.android.apps.docs",
            "com.google.android.apps.maps",
            "com.android.chrome",
            "com.google.android.gm"  // Gmail
        ));
        this.usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
        this.packageManager = reactContext.getPackageManager();
    }

    private Set<String> getLauncherPackages() {
        Set<String> launchers = new HashSet<>();
        PackageManager pm = reactContext.getPackageManager();
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_HOME);
        List<ResolveInfo> resolveInfos = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        
        for (ResolveInfo resolveInfo : resolveInfos) {
            launchers.add(resolveInfo.activityInfo.packageName);
        }
        return launchers;
    }

    private boolean isSystemApp(ApplicationInfo ai) {
        String ownPackageName = reactContext.getPackageName();
        
        // Якщо додаток в списку дозволених системних додатків, дозволяємо його
        // if (allowedSystemApps.contains(ai.packageName)) {
        //     return false;
        // }

        // Перевіряємо чи це не Reclaim і чи не лаунчер
        if (ai.packageName.equals(ownPackageName) ||
            ai.packageName.equals("com.reclaim") ||
            launcherPackages.contains(ai.packageName)) {
            return true;
        }
        return false;
        // Перевіряємо чи це системний додаток
        // return ((ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0) ||
        //        ((ai.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0);
    }

    @NonNull
    @Override
    public String getName() {
        return "UsageStatsModule";
    }

    @ReactMethod
    public void checkUsagePermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, 
                android.os.Process.myUid(), reactContext.getPackageName());
            boolean granted = mode == AppOpsManager.MODE_ALLOWED;
            promise.resolve(granted);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    @ReactMethod
    public void getUsageStats(String period, String customDate, Promise promise) {
        try {
            UsageStatsManager usm = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            PackageManager pm = reactContext.getPackageManager();
            
            // Отримуємо часові рамки
            long endTime = System.currentTimeMillis();
            long startTime;
            
            if (period.equals("CUSTOM") && customDate != null && !customDate.isEmpty()) {
                // Парсимо дату у форматі "yyyy-MM-dd"
                String[] dateParts = customDate.split("-");
                Calendar calendar = Calendar.getInstance();
                calendar.set(Calendar.YEAR, Integer.parseInt(dateParts[0]));
                calendar.set(Calendar.MONTH, Integer.parseInt(dateParts[1]) - 1); // Місяці в Calendar починаються з 0
                calendar.set(Calendar.DAY_OF_MONTH, Integer.parseInt(dateParts[2]));
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
                startTime = calendar.getTimeInMillis();
                
                // Встановлюємо кінець дня
                calendar.set(Calendar.HOUR_OF_DAY, 23);
                calendar.set(Calendar.MINUTE, 59);
                calendar.set(Calendar.SECOND, 59);
                calendar.set(Calendar.MILLISECOND, 999);
                endTime = calendar.getTimeInMillis();
            } else {
                startTime = getStartTime(period);
            }
            
            // Для тижня і місяця розбиваємо на денні інтервали для більшої точності
            Map<String, Long> aggregatedStats = new HashMap<>();
            Map<String, String> appNames = new HashMap<>();
            
            if (period.equals("WEEK") || period.equals("MONTH")) {
                // Розбиваємо період на денні інтервали
                Calendar calendar = Calendar.getInstance();
                calendar.setTimeInMillis(startTime);
                
                while (calendar.getTimeInMillis() < endTime) {
                    // Встановлюємо початок дня
                    calendar.set(Calendar.HOUR_OF_DAY, 0);
                    calendar.set(Calendar.MINUTE, 0);
                    calendar.set(Calendar.SECOND, 0);
                    calendar.set(Calendar.MILLISECOND, 0);
                    long dayStart = calendar.getTimeInMillis();
                    
                    // Встановлюємо кінець дня
                    calendar.set(Calendar.HOUR_OF_DAY, 23);
                    calendar.set(Calendar.MINUTE, 59);
                    calendar.set(Calendar.SECOND, 59);
                    calendar.set(Calendar.MILLISECOND, 999);
                    long dayEnd = Math.min(calendar.getTimeInMillis(), endTime);
                    
                    // Отримуємо статистику за день
                    List<UsageStats> dayStats = usm.queryUsageStats(
                        UsageStatsManager.INTERVAL_DAILY,
                        dayStart,
                        dayEnd
                    );
                    
                    processDailyStats(dayStats, pm, aggregatedStats, appNames, dayStart, dayEnd);
                    
                    // Переходимо до наступного дня
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                }
            } else {
                // Для одного дня використовуємо звичайний запит
                List<UsageStats> appList = usm.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    startTime,
                    endTime
                );
                processDailyStats(appList, pm, aggregatedStats, appNames, startTime, endTime);
            }
            
            // Формуємо результат
            WritableArray result = Arguments.createArray();
            for (Map.Entry<String, Long> entry : aggregatedStats.entrySet()) {
                String packageName = entry.getKey();
                WritableMap app = Arguments.createMap();
                app.putString("packageName", packageName);
                app.putString("appName", appNames.get(packageName));
                app.putDouble("timeInSeconds", entry.getValue());
                result.pushMap(app);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    private void processDailyStats(
        List<UsageStats> stats,
        PackageManager pm,
        Map<String, Long> aggregatedStats,
        Map<String, String> appNames,
        long startTime,
        long endTime
    ) {
        if (stats == null) return;
        
        for (UsageStats usageStats : stats) {
            String packageName = usageStats.getPackageName();
            
            try {
                ApplicationInfo ai = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA);
                
                // Пропускаємо системні додатки та Reclaim
                if (isSystemApp(ai)) {
                    continue;
                }
                
                // Перевіряємо, чи використання було в заданому періоді
                long lastTimeUsed = usageStats.getLastTimeUsed();
                if (lastTimeUsed < startTime || lastTimeUsed > endTime) {
                    continue;
                }
                
                long timeInForeground = usageStats.getTotalTimeInForeground();
                if (timeInForeground > 0) {
                    // Конвертуємо в секунди
                    long timeInSeconds = timeInForeground / 1000;
                    
                    // Додаємо до загального часу використання
                    aggregatedStats.merge(packageName, timeInSeconds, Long::sum);
                    
                    // Зберігаємо ім'я додатку
                    if (!appNames.containsKey(packageName)) {
                        String appName = pm.getApplicationLabel(ai).toString();
                        appNames.put(packageName, appName);
                    }
                }
            } catch (PackageManager.NameNotFoundException e) {
                continue;
            }
        }
    }

    private long getStartTime(String period) {
        Calendar calendar = Calendar.getInstance();
        
        switch (period) {
            case "CUSTOM":
                // Для CUSTOM режиму використовуємо поточну дату
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
                break;
            case "DAY":
                // Встановлюємо час на початок поточного дня (00:00:00)
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
                break;
            case "WEEK":
                // Встановлюємо на початок поточного тижня (Понеділок, 00:00)
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
                
                // Встановлюємо перший день тижня як понеділок
                calendar.setFirstDayOfWeek(Calendar.MONDAY);
                // Отримуємо поточний день тижня
                int dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
                // Вираховуємо різницю днів до понеділка
                int diff = dayOfWeek - calendar.getFirstDayOfWeek();
                if (diff < 0) {
                    diff += 7;
                }
                // Віднімаємо різницю днів, щоб отримати дату понеділка
                calendar.add(Calendar.DAY_OF_MONTH, -diff);
                break;
            case "MONTH":
                // Встановлюємо на початок поточного місяця
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
                calendar.set(Calendar.DAY_OF_MONTH, 1);
                break;
            default:
                // За замовчуванням - початок поточного дня
                calendar.set(Calendar.HOUR_OF_DAY, 0);
                calendar.set(Calendar.MINUTE, 0);
                calendar.set(Calendar.SECOND, 0);
                calendar.set(Calendar.MILLISECOND, 0);
        }
        
        return calendar.getTimeInMillis();
    }

    private int getIntervalType(String period) {
        switch (period) {
            case "DAY":
                return UsageStatsManager.INTERVAL_DAILY;
            case "WEEK":
                return UsageStatsManager.INTERVAL_WEEKLY;
            case "MONTH":
                return UsageStatsManager.INTERVAL_MONTHLY;
            default:
                return UsageStatsManager.INTERVAL_DAILY;  // Default to daily
        }
    }

    @ReactMethod
    public void openUsageSettings() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray installedApps = Arguments.createArray();
            String ownPackageName = reactContext.getPackageName();
            
            for (ApplicationInfo packageInfo : packages) {
                // Пропускаємо системні додатки та Reclaim
                if ((packageInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0 
                    && !packageInfo.packageName.equals(ownPackageName)) {
                    WritableMap appInfo = Arguments.createMap();
                    appInfo.putString("packageName", packageInfo.packageName);
                    appInfo.putString("appName", pm.getApplicationLabel(packageInfo).toString());
                    installedApps.pushMap(appInfo);
                }
            }
            
            promise.resolve(installedApps);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void checkUsageStatsPermission(Promise promise) {
        AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            reactContext.getPackageName()
        );
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", "Error requesting usage stats permission", e);
        }
    }

    @ReactMethod
    public void getDailyScreenTime(double startTimeMillis, double endTimeMillis, Promise promise) {
        try {
            UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usageStatsManager == null) {
                promise.reject("ERROR", "UsageStatsManager is not available");
                return;
            }

            // Convert double to long
            long startTime = (long) startTimeMillis;
            long endTime = (long) endTimeMillis;

            // Create a map to store daily totals
            HashMap<String, Long> dailyTotals = new HashMap<>();
            
            // Get usage stats for the time range
            List<UsageStats> stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            );

            // Calculate daily totals
            for (UsageStats stat : stats) {
                long timeInForeground = stat.getTotalTimeInForeground();
                Calendar calendar = Calendar.getInstance();
                calendar.setTimeInMillis(stat.getFirstTimeStamp());
                
                // Format date as yyyy-MM-dd
                String date = String.format("%d-%02d-%02d",
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH) + 1,
                    calendar.get(Calendar.DAY_OF_MONTH)
                );

                // Add to daily total
                dailyTotals.merge(date, timeInForeground, Long::sum);
            }

            // Convert to WritableArray for React Native
            WritableArray result = Arguments.createArray();
            for (Map.Entry<String, Long> entry : dailyTotals.entrySet()) {
                WritableMap dayStats = Arguments.createMap();
                dayStats.putString("date", entry.getKey());
                dayStats.putDouble("timeInForeground", entry.getValue().doubleValue());
                result.pushMap(dayStats);
            }

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting daily screen time", e);
            promise.reject("ERROR", "Error getting daily screen time: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getAppsUsageTime(com.facebook.react.bridge.ReadableArray packageNames, double startTimeMillis, double endTimeMillis, Promise promise) {
        try {
            UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usageStatsManager == null) {
                promise.reject("ERROR", "UsageStatsManager is not available");
                return;
            }

            // Convert double to long
            long startTime = (long) startTimeMillis;
            long endTime = (long) endTimeMillis;

            // Get usage stats for the time range
            List<UsageStats> stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_BEST,
                startTime,
                endTime
            );

            // Create result array
            WritableArray result = Arguments.createArray();

            // Convert packageNames to List for easier checking
            List<Object> packageNamesList = packageNames.toArrayList();

            // Calculate usage for each requested package
            for (UsageStats stat : stats) {
                if (packageNamesList.contains(stat.getPackageName())) {
                    WritableMap appStats = Arguments.createMap();
                    appStats.putString("packageName", stat.getPackageName());
                    appStats.putDouble("timeInForeground", stat.getTotalTimeInForeground());
                    result.pushMap(appStats);
                }
            }

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting apps usage time", e);
            promise.reject("ERROR", "Error getting apps usage time: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getCurrentApp(Promise promise) {
        try {
            if (!checkUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted");
                return;
            }

            long endTime = System.currentTimeMillis();
            long startTime = endTime - 1000 * 60; // Перевіряємо останню хвилину

            UsageEvents.Event currentEvent = new UsageEvents.Event();
            String currentPackageName = null;
            String currentAppName = null;

            UsageEvents usageEvents = usageStatsManager.queryEvents(startTime, endTime);
            
            // Шукаємо останню подію MOVE_TO_FOREGROUND
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(currentEvent);
                if (currentEvent.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    currentPackageName = currentEvent.getPackageName();
                }
            }

            if (currentPackageName != null) {
                try {
                    ApplicationInfo appInfo = packageManager.getApplicationInfo(currentPackageName, 0);
                    currentAppName = packageManager.getApplicationLabel(appInfo).toString();

                    WritableMap result = new WritableNativeMap();
                    result.putString("packageName", currentPackageName);
                    result.putString("appName", currentAppName);
                    promise.resolve(result);
                } catch (PackageManager.NameNotFoundException e) {
                    promise.reject("APP_NOT_FOUND", "Could not find app info");
                }
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("ERROR", "Error getting current app: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getTodayUsageTime(String packageName, Promise promise) {
        try {
            if (!checkUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted");
                return;
            }

            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();

            long totalTime = 0;
            UsageEvents.Event currentEvent = new UsageEvents.Event();
            UsageEvents usageEvents = usageStatsManager.queryEvents(startTime, endTime);
            
            long lastEventTime = 0;
            boolean isAppInForeground = false;

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(currentEvent);
                
                if (currentEvent.getPackageName().equals(packageName)) {
                    if (currentEvent.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                        lastEventTime = currentEvent.getTimeStamp();
                        isAppInForeground = true;
                    } else if (currentEvent.getEventType() == UsageEvents.Event.MOVE_TO_BACKGROUND && isAppInForeground) {
                        totalTime += (currentEvent.getTimeStamp() - lastEventTime);
                        isAppInForeground = false;
                    }
                }
            }

            // Якщо додаток все ще у фокусі, додаємо час до поточного моменту
            if (isAppInForeground) {
                totalTime += (System.currentTimeMillis() - lastEventTime);
            }

            promise.resolve(totalTime);
        } catch (Exception e) {
            promise.reject("ERROR", "Error getting usage time: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getAppUsageStatsForPeriod(double startTime, double endTime, String packageName, Promise promise) {
        try {
            if (!checkUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted");
                return;
            }

            long longStartTime = (long) startTime;
            long longEndTime = (long) endTime;

            long totalTime = 0;
            UsageEvents.Event currentEvent = new UsageEvents.Event();
            UsageEvents usageEvents = usageStatsManager.queryEvents(longStartTime, longEndTime);
            
            long lastEventTime = 0;
            boolean isAppInForeground = false;

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(currentEvent);
                
                if (currentEvent.getPackageName().equals(packageName)) {
                    if (currentEvent.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                        lastEventTime = currentEvent.getTimeStamp();
                        isAppInForeground = true;
                    } else if (currentEvent.getEventType() == UsageEvents.Event.MOVE_TO_BACKGROUND && isAppInForeground) {
                        totalTime += (currentEvent.getTimeStamp() - lastEventTime);
                        isAppInForeground = false;
                    }
                }
            }

            if (isAppInForeground) {
                 if (lastEventTime < longEndTime) {
                    totalTime += (longEndTime - lastEventTime);
                 }
            }

            promise.resolve((double)totalTime);
        } catch (Exception e) {
            promise.reject("ERROR", "Error getting app usage stats for period: " + e.getMessage());
        }
    }

    private boolean checkUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactContext.getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }
}
