package com.zegouikitprebuiltcallrn;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ServiceInfo;
import android.os.Build.VERSION;
import android.os.Build.VERSION_CODES;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;

/**
 * foreground service, when receive fcm data,use this service to show a Notification .
 */
public class OffLineCallNotificationService extends Service {

    private PowerManager.WakeLock wakeLock;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return super.onStartCommand(null, flags, startId);
        }

        Log.d("NotificationService", "onStartCommand() called with: intent.getAction() = [" + intent.getAction() + "]");

        if (CallNotificationManager.ACTION_DECLINE_CALL.equals(intent.getAction())) {
            sendEvent("RNCallKitPerformEndCallAction", null);
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else if (CallNotificationManager.ACTION_CLICK.equals(intent.getAction())) {
            // click will start service ,then start app,inject action here
            // while click accept button will start app directly
            startApp();
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else if (CallNotificationManager.ACTION_ACCEPT_CALL.equals(intent.getAction())) {
            sendEvent("RNCallKitPerformAnswerCallAction", null);
            startApp();
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else {
            Notification callNotification = CallNotificationManager.getInstance().createCallNotification(this);
            if (callNotification != null) {
                if (VERSION.SDK_INT >= VERSION_CODES.Q) {
                    startForeground(CallNotificationManager.callNotificationID, callNotification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
                } else {
                    startForeground(CallNotificationManager.callNotificationID, callNotification);
                }
                wakeup();
            }
            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
                }
                }, 60000);
        }
        return super.onStartCommand(intent, flags, startId);
    }

    public void wakeup() {
        PowerManager powerManager = (PowerManager)getSystemService(Context.POWER_SERVICE);
        int flag = PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE;
        wakeLock = powerManager.newWakeLock(flag, "ZegoPrebuiltCall::WakelockTag");
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(60*1000L /*60s */);
        }
    }

    public void startApp() {
        Intent intent = null;
        try {
            intent = new Intent(this, Class.forName(getLauncherActivity()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
    }

    public String getLauncherActivity() {
        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.setPackage(getApplication().getPackageName());
        PackageManager pm = getApplication().getPackageManager();
        List<ResolveInfo> info = pm.queryIntentActivities(intent, 0);
        if (info == null || info.size() == 0) {
            return "";
        }
        return info.get(0).activityInfo.name;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);

        // release wakeLock.
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        ReactApplicationContext context = ZegoUIKitPrebuiltCallRNModule
            .reactContext;
        if (context.hasActiveCatalystInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }
}
