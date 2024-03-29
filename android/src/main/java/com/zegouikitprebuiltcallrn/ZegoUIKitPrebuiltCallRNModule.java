package com.zegouikitprebuiltcallrn;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.RequiresApi;

@ReactModule(name = ZegoUIKitPrebuiltCallRNModule.NAME)
public class ZegoUIKitPrebuiltCallRNModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ZegoUIKitPrebuiltCallRNModule";

    private static ReactApplicationContext reactContext;


    public ZegoUIKitPrebuiltCallRNModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }


    // Example method
    // See https://reactnative.dev/docs/native-modules-android
    @ReactMethod
    public void multiply(double a, double b, Promise promise) {
        promise.resolve(a * b);
    }


  @RequiresApi(api = Build.VERSION_CODES.O_MR1)
  @ReactMethod
  public void dismissKeyguard(Activity activity){
    KeyguardManager keyguardManager = (KeyguardManager) reactContext.getSystemService(
      Context.KEYGUARD_SERVICE
    );
    boolean isLocked = keyguardManager.isKeyguardLocked();
    if (isLocked) {
      Log.d("ZegoUIKitPrebuiltCallRNModule", "screen is locked");
    //   activity.setShowWhenLocked(true);
    //   activity.setTurnScreenOn(true);
      keyguardManager.requestDismissKeyguard(
        activity,
        new KeyguardManager.KeyguardDismissCallback() {
          @Override
          public void onDismissError() {
            Log.d("ZegoUIKitPrebuiltCallRNModule", "onDismissError");
          }

          @Override
          public void onDismissSucceeded() {
            Log.d("ZegoUIKitPrebuiltCallRNModule", "onDismissSucceeded");
          }

          @Override
          public void onDismissCancelled() {
            Log.d("ZegoUIKitPrebuiltCallRNModule", "onDismissCancelled");
          }
        }
      );
    } else {
      Log.d("ZegoUIKitPrebuiltCallRNModule", "unlocked");
    }
  }

  @ReactMethod
  public void startActivity() {
    Log.d("ZegoUIKitPrebuiltCallRNModule", "start activity");
    Context context = getAppContext();
    String packageName = context.getApplicationContext().getPackageName();
    Intent focusIntent = context.getPackageManager().getLaunchIntentForPackage(packageName).cloneFilter();
    Activity activity = getCurrentActivity();
    boolean isRunning = activity != null;

    if(isRunning){
      Log.d("ZegoUIKitPrebuiltCallRNModule", "activity is running");
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      activity.startActivity(focusIntent);
      dismissKeyguard(activity);
    } else {
      Log.d("ZegoUIKitPrebuiltCallRNModule", "activity is not running, starting activity");
      focusIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK + Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
      context.startActivity(focusIntent);
    }
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

  private Context getAppContext() {
    return this.reactContext.getApplicationContext();
  }
}
