package com.zegouikitprebuiltcallrn;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.zegouikitprebuiltcallrn.customview.CustomCallNotificationManager;
import com.zegouikitprebuiltcallrn.utils.XLogWrapper;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

@Keep
@ReactModule(name = ZegoUIKitPrebuiltCallRNModule.NAME)
public class ZegoUIKitPrebuiltCallRNModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ZegoUIKitPrebuiltCallRNModule";

    public static ReactApplicationContext reactContext;

    private AlertDialog alertDialog;
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public ZegoUIKitPrebuiltCallRNModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void setTimeout(final int id, final double timeout) {
      Handler handler = new Handler();
      handler.postDelayed(new Runnable(){
        @Override
        public void run(){
          if (getReactApplicationContext().hasActiveReactInstance()) {
            getReactApplicationContext()
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("backgroundTimer.timeout", id);
          }
        }
      }, (long) timeout);
    }

    @ReactMethod
    public void setupCallKit(ReadableMap options) {
        XLogWrapper.i(NAME, "setupCallKit");

        CustomCallNotificationManager.getInstance().setupOptions(options);
    }

    @ReactMethod
    public void displayIncomingCall(String callID, String title, String message, int timeout) {
        mainHandler.post(() -> {
            XLogWrapper.i(NAME, String.format("displayIncomingCall callID: %s, title: %s, message: %s, timeout: %d", callID, title, message, timeout));
            CustomCallNotificationManager.getInstance().showCallNotification(reactContext, callID, title, message, timeout);
        });
    }

    @ReactMethod
    public void dismissCallNotification() {
        mainHandler.post(() -> {
            XLogWrapper.i(NAME, "dismissCallNotification");
            CustomCallNotificationManager.getInstance().dismissCallNotification(reactContext);
        });
    }

    @ReactMethod
    public void requestSystemAlertWindow(String message, String allow, String deny) {
        if (alertDialog != null && alertDialog.isShowing()) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
            AlertDialog.Builder builder = new AlertDialog.Builder(reactContext.getCurrentActivity());
            builder.setMessage(message);
            builder.setPositiveButton(allow, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    intent.setData(Uri.parse("package:" + reactContext.getPackageName()));
                    reactContext.startActivityForResult(intent, 0, new Bundle());
                }
            });
            builder.setNegativeButton(deny, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {

                }
            });

            alertDialog = builder.create();
            alertDialog.setCancelable(false);
            alertDialog.setCanceledOnTouchOutside(false);
            alertDialog.show();
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public int getApiLevelSync() {
        return Build.VERSION.SDK_INT;
    }

    @ReactMethod
    public void changeToReceiver() {
        AudioManager audioManager = (AudioManager)getAppContext().getSystemService(Context.AUDIO_SERVICE);
        audioManager.setSpeakerphoneOn(false);
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        XLogWrapper.i(NAME, "changeToReceiver");
    }

    @ReactMethod
    public void changeToSpeaker() {
        AudioManager audioManager = (AudioManager)getAppContext().getSystemService(Context.AUDIO_SERVICE);
        audioManager.setSpeakerphoneOn(true);
        audioManager.setMode(AudioManager.MODE_NORMAL);
        XLogWrapper.i(NAME, "changeToSpeaker");
    }

    // For versions below Android 13
    @ReactMethod
    public void areNotificationsEnabled(Promise promise) {
        boolean areEnabled = NotificationManagerCompat.from(getAppContext()).areNotificationsEnabled();
        promise.resolve(areEnabled);
    }

    private Context getAppContext() {
      return this.reactContext.getApplicationContext();
    }
}
