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
    public String currentShowCallID = "";

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

    public void showCallNotification(Context context, String callID, String title, String message, int timeout) {
        XLogWrapper.i(TAG, "showCallNotification() called with: context = [%s], callID = '%s', title = '%s', message = '%s'", context, callID, title, message);

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
            "id", callID,
            "nameCaller", title,
//            "appName", "",
            "handle", message,
//            "type", 0,
            "duration", timeout * 1000,
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

        currentShowCallID = callID;
        XLogWrapper.i(TAG, String.format("showCallNotification, set currentShowCallID: %s", currentShowCallID));
    }

    public void dismissCallNotification(Context context) {
        currentShowCallID = "";
        XLogWrapper.i(TAG, "dismissCallNotification, set currentShowCallID:");

        ArrayList<Data> dataList = SharedPreferencesUtilsKt.getDataActiveCalls(context);
        for (Data data : dataList) {
            XLogWrapper.i(TAG, String.format("dismissCallNotification, IntentEnded id: %s", data.getId()));
            context.sendBroadcast(
                CallkitIncomingBroadcastReceiver.Companion.getIntentEnded(
                    context,
                    data.toBundle()
                )
            );
        }
    }
}
