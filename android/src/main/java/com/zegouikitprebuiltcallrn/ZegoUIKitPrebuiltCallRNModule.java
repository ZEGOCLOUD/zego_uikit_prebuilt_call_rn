package com.zegouikitprebuiltcallrn;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;

@ReactModule(name = ZegoUIKitPrebuiltCallRNModule.NAME)
public class ZegoUIKitPrebuiltCallRNModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ZegoUIKitPrebuiltCallRNModule";

    public static ReactApplicationContext reactContext;

    private AlertDialog alertDialog;


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
          if (getReactApplicationContext().hasActiveCatalystInstance()) {
            getReactApplicationContext()
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("backgroundTimer.timeout", id);
          }
        }
      }, (long) timeout);
    }

    @ReactMethod
    public void setupCallKit(ReadableMap options) {
        CallNotificationManager.getInstance().setupOptions(options);
    }

    @ReactMethod
    public void displayIncomingCall(String title, String message) {
        CallNotificationManager
            .getInstance()
            .showCallNotification(reactContext, title, message);
    }

    @ReactMethod
    public void endCall() {
        CallNotificationManager.getInstance().dismissCallNotification(reactContext);
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

    private Context getAppContext() {
      return this.reactContext.getApplicationContext();
    }
}
