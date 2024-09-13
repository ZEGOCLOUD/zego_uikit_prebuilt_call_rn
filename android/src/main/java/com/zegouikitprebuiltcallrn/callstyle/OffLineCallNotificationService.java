package com.zegouikitprebuiltcallrn.callstyle;

import static com.zegouikitprebuiltcallrn.callstyle.CallNotificationManager.ACTION_ACCEPT_CALL;
import static com.zegouikitprebuiltcallrn.callstyle.CallNotificationManager.ACTION_CLICK;
import static com.zegouikitprebuiltcallrn.callstyle.CallNotificationManager.ACTION_DECLINE_CALL;

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

import androidx.annotation.Nullable;

import com.elvishew.xlog.XLog;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.zegouikitprebuiltcallrn.ZegoUIKitPrebuiltCallRNModule;

import java.util.List;
import java.util.Locale;

/**
 * foreground service, when receive fcm data,use this service to show a Notification .
 */
public class OffLineCallNotificationService extends Service {
    private String TAG = "OffLineCallNotificationService";

    private PowerManager.WakeLock wakeLock;
    private Handler dismissHandler;
    private Runnable dismissTask;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        dismissHandler = new Handler(Looper.getMainLooper());
        dismissTask = new Runnable() {
            @Override
            public void run() {
                CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
                sendEvent("RNCallKitPerformEndCallAction", true);   // timeout
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        XLog.i(String.format(Locale.getDefault(), "[%s] onStartCommand, flag: %d, startId:%d", TAG, flags, startId));

        if (intent == null) {
            return super.onStartCommand(null, flags, startId);
        }

        XLog.i("[%s] onStartCommand() called with: intent.getAction() = [%s]", TAG, intent.getAction());

        if (ACTION_DECLINE_CALL.equals(intent.getAction())) {
            XLog.i("[%s] onStartCommand, intent action: %s", TAG, ACTION_DECLINE_CALL);
            sendEvent("RNCallKitPerformEndCallAction", null);
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else if (ACTION_CLICK.equals(intent.getAction())) {
            XLog.i("[%s] onStartCommand, intent action: %s", TAG, ACTION_CLICK);
            // click will start service ,then start app,inject action here
            // while click accept button will start app directly
            startApp();
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else if (ACTION_ACCEPT_CALL.equals(intent.getAction())) {
            XLog.i("[%s] onStartCommand, intent action: %s", TAG, ACTION_ACCEPT_CALL);
            sendEvent("RNCallKitPerformAnswerCallAction", null);
            startApp();
            CallNotificationManager.getInstance().dismissCallNotification(getApplicationContext());
        } else {
            XLog.i("[%s] onStartCommand, intent action: %s", TAG, "default");
            Notification callNotification = CallNotificationManager.getInstance().createCallNotification(this);
            if (callNotification != null) {
                if (VERSION.SDK_INT >= VERSION_CODES.Q) {
                    startForeground(CallNotificationManager.callNotificationID, callNotification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
                } else {
                    startForeground(CallNotificationManager.callNotificationID, callNotification);
                }
                wakeup();
                dismissHandler.postDelayed(dismissTask, 60000);
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }

    public void wakeup() {
        XLog.i("[%s] wakeup", TAG);

        PowerManager powerManager = (PowerManager)getSystemService(Context.POWER_SERVICE);
        int flag = PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE;
        wakeLock = powerManager.newWakeLock(flag, "ZegoPrebuiltCall::WakelockTag");
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(60*1000L /*60s */);
        }
    }

    public void startApp() {
        XLog.i("[%s] startApp", TAG);

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

        dismissHandler.removeCallbacks(dismissTask);
    }

    private void sendEvent(String eventName, @Nullable Object params) {
        ReactApplicationContext context = ZegoUIKitPrebuiltCallRNModule
            .reactContext;
        if (context.hasActiveCatalystInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }
}
