package com.zegouikitprebuiltcallrn.customview;

import android.content.Context;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableMap;
import com.hiennv.flutter_callkit_incoming.CallkitIncomingBroadcastReceiver;
import com.hiennv.flutter_callkit_incoming.Data;
import com.hiennv.flutter_callkit_incoming.SharedPreferencesUtilsKt;
import com.zegouikitprebuiltcallrn.utils.XLogWrapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class CustomCallNotificationManager {
    private static final String TAG = "CustomCallNotificationManager";

    private String soundName = "";
    private String incomingAcceptButtonText = "Accept";
    private String incomingDeclineButtonText = "Decline";

    private CustomCallNotificationManager() {
    }

    private static final class Holder {
        private static final CustomCallNotificationManager INSTANCE = new CustomCallNotificationManager();
    }

    public static CustomCallNotificationManager getInstance() {
        return CustomCallNotificationManager.Holder.INSTANCE;
    }

    public void setupOptions(ReadableMap options) {
        XLogWrapper.i(TAG, "setupOptions: %s", options);

        this.soundName = options.getString("incomingCallFileName");
        String acceptText = options.getString("incomingAcceptButtonText");
        if (!TextUtils.isEmpty(acceptText)) {
            this.incomingAcceptButtonText = acceptText;
        }
        String declineText = options.getString("incomingDeclineButtonText");
        if (!TextUtils.isEmpty(declineText)) {
            this.incomingDeclineButtonText = declineText;
        }
    }

    public void showCallNotification(Context context, String title, String message) {
        XLogWrapper.i(TAG, "showCallNotification() called with: context = [%s], title = '%s', message = '%s'", context, title, message);

        HashMap<String, Object> androidParams = new HashMap<>(Map.of(
            "isCustomNotification", true,
            "isShowFullLockedScreen", false,
            "isShowLogo", false,
            "isShowCallID", true,   // show message
            "ringtonePath", this.soundName,
            "backgroundColor", "",  // todo
            "backgroundUrl", "",    // todo
            "actionColor", ""       // todo
        ));
        XLogWrapper.i(TAG, "androidParams: %s", androidParams);

        HashMap<String, Object> missedCallParams = new HashMap<>(Map.of(
            "showNotification", false
        ));
        XLogWrapper.i(TAG, "missedCallParams: %s", missedCallParams);

        HashMap<String, Object> dataMap = new HashMap<>(Map.of(
            "id", UUID.randomUUID().toString(),
            "nameCaller", title,
//            "appName", "",
            "handle", message,
//            "type", 0,
            "duration", 60*1000,
            "textAccept", this.incomingAcceptButtonText,
            "textDecline", this.incomingDeclineButtonText,
//            "extra", new HashMap<String, Object>(),
//            "headers", new HashMap<String, Object>(),
            "missedCallNotification", missedCallParams,
            "android", androidParams
        ));
        XLogWrapper.i(TAG, "dataMap: %s", dataMap);

        Data data = new Data(dataMap);
        data.setFrom("notification");
        context.sendBroadcast(
            CallkitIncomingBroadcastReceiver.Companion.getIntentIncoming(
                context,
                data.toBundle()
            )
        );
    }

    public void dismissCallNotification(Context context) {
        XLogWrapper.i(TAG, "dismissCallNotification");

        ArrayList<Data> dataList = SharedPreferencesUtilsKt.getDataActiveCalls(context);
        for (Data data : dataList) {
            context.sendBroadcast(
                CallkitIncomingBroadcastReceiver.Companion.getIntentEnded(
                    context,
                    data.toBundle()
                )
            );
        }
    }
}
