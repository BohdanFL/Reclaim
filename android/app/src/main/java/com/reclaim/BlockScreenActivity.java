package com.reclaim;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import android.view.WindowManager;
import android.content.Intent;
import android.provider.Settings;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;
import android.os.Build;

public class BlockScreenActivity extends AppCompatActivity {
    private static final String TAG = "BlockScreenActivity";
    private TextView messageText;
    private TextView timerText;
    private Button returnButton;
    private Handler timerHandler;
    private Runnable timerRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate: Starting BlockScreenActivity");

        // Set window flags for proper overlay display
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            WindowManager.LayoutParams.FLAG_FULLSCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
        );
        Log.d(TAG, "onCreate: Window flags set");

        // Set window type for overlay
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getWindow().setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        } else {
            getWindow().setType(WindowManager.LayoutParams.TYPE_SYSTEM_ALERT);
        }
        Log.d(TAG, "onCreate: Window type set to overlay");

        setContentView(R.layout.activity_block_screen);

        // Get blocked app name from intent
        String blockedAppName = getIntent().getStringExtra("blockedAppName");
        Log.i(TAG, String.format("Blocking app: %s", blockedAppName));

        // Initialize views
        messageText = findViewById(R.id.messageText);
        timerText = findViewById(R.id.timerText);
        returnButton = findViewById(R.id.returnButton);
        Log.d(TAG, "onCreate: Views initialized");

        // Set message with blocked app name
        messageText.setText(String.format("Зараз активна фокус-сесія. Додаток %s тимчасово недоступний.", blockedAppName));

        // Initialize timer handler
        timerHandler = new Handler(Looper.getMainLooper());
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (!AppBlockerService.isSessionActive() || AppBlockerService.isPaused()) {
                    Log.d(TAG, "Session is not active or paused, finishing activity");
                    finish();
                    return;
                }

                long timeLeft = AppBlockerService.getTimeLeft();
                if (timeLeft <= 0) {
                    Log.d(TAG, "Timer finished, closing block screen");
                    finish();
                    return;
                }

                updateTimer(timeLeft);
                timerHandler.postDelayed(this, 1000); // Update every second
            }
        };

        // Set up return button with improved click handling
        returnButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d(TAG, "Return button clicked, navigating to MainActivity");
                // Launch main activity with proper flags
                Intent intent = new Intent(BlockScreenActivity.this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                              Intent.FLAG_ACTIVITY_CLEAR_TOP | 
                              Intent.FLAG_ACTIVITY_SINGLE_TOP);
                startActivity(intent);
                finish();
            }
        });

        // Check overlay permission
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "No overlay permission, requesting it now");
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            finish();
            return;
        }
        Log.d(TAG, "onCreate: Overlay permission confirmed");

        // Start timer updates
        timerHandler.post(timerRunnable);
    }

    private void updateTimer(long millisLeft) {
        long minutes = (millisLeft / 1000) / 60;
        long seconds = (millisLeft / 1000) % 60;
        String timeText = String.format("Залишилось: %02d:%02d", minutes, seconds);
        timerText.setText(timeText);
        Log.d(TAG, "Timer updated: " + timeText);
    }

    @Override
    public void onBackPressed() {
        Log.d(TAG, "Back button pressed, redirecting to MainActivity");
        // Override back button to prevent easy exit
        // Instead, launch main activity
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume called");
        // Перевіряємо дозвіл на оверлей при відновленні активності
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "onResume: No overlay permission, finishing activity");
            finish();
            return;
        }

        // Check if session is still active
        if (!AppBlockerService.isSessionActive() || AppBlockerService.isPaused()) {
            Log.d(TAG, "onResume: Session is not active or paused, finishing activity");
            finish();
            return;
        }

        // Resume timer updates
        timerHandler.post(timerRunnable);
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "onPause called");
        // Stop timer updates
        timerHandler.removeCallbacks(timerRunnable);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy called");
        // Ensure timer updates are stopped
        timerHandler.removeCallbacks(timerRunnable);
    }
} 