package com.zegouikitprebuiltcallrn.callstyle;

import static com.zegouikitprebuiltcallrn.utils.RingtoneUtils.getRingtone;

import android.app.Notification;
import android.app.Notification.Builder;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Build.VERSION_CODES;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.Action;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.elvishew.xlog.XLog;
import com.facebook.react.bridge.ReadableMap;
import com.zegouikitprebuiltcallrn.utils.XLogWrapper;

public class CallNotificationManager {
    private static final String TAG = "CallNotificationManager";

    public static final String ACTION_ACCEPT_CALL = "accept";
    public static final String ACTION_DECLINE_CALL = "decline";
    public static final String ACTION_CLICK = "click";

    public static final int callNotificationID = 23432;
    public static final String callNotificationChannelID = "call_notification_id";
    private static final String callNotificationChannelName = "call_notification_name";
    private static final String callNotificationChannelDesc = "call_notification_desc";

    private boolean isNotificationShowed;

    private String notificationTitle;
    private String notificationMessage;
    private String soundName;

    private String incomingAcceptButtonText = "Accept";
    private String incomingDeclineButtonText = "Decline";

    private CallNotificationManager() {

    }

    private static final class Holder {
      private static final CallNotificationManager INSTANCE = new CallNotificationManager();
    }

    public static CallNotificationManager getInstance() {
      return CallNotificationManager.Holder.INSTANCE;
    }

    public void setupOptions(ReadableMap options) {
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

        this.notificationTitle = title;
        this.notificationMessage = message;

        // 设置通知效果，铃声、振动等
        createCallNotificationChannel(context);

        ContextCompat.startForegroundService(context, new Intent(context, OffLineCallNotificationService.class));
        isNotificationShowed = true;
        XLogWrapper.i(TAG, "showCallNotification, startForegroundService");
    }

    public void showCallBackgroundNotification(Context context, String title, String message) {
        XLog.i("[%s] showCallBackgroundNotification() called with: context = [%s]", TAG, context);

        this.notificationTitle = title;
        this.notificationMessage = message;
        createCallNotificationChannel(context);
        Notification callNotification = createCallNotification(context);
        NotificationManagerCompat.from(context).notify(callNotificationID, callNotification);
        isNotificationShowed = true;
    }

    public void createCallNotificationChannel(Context context) {
        String channelID = callNotificationChannelID;
        String channelName = callNotificationChannelName;
        String channelDesc = callNotificationChannelDesc;
        Uri ringtone = getRingtone(context, this.soundName);
        XLogWrapper.i(TAG, "getRingtone: %s", ringtone);

        if (Build.VERSION.SDK_INT >= VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelID, channelName,
                NotificationManager.IMPORTANCE_HIGH);
            channel.setSound(ringtone, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setDescription(channelDesc);
            NotificationManagerCompat.from(context).createNotificationChannel(channel);
        }
    }

    public void dismissCallNotification(Context context) {
        Log.i(TAG, "dismissCallNotification");

        Intent intent = new Intent(context, OffLineCallNotificationService.class);
        isNotificationShowed = false;
        context.stopService(intent);

        NotificationManagerCompat.from(context).cancel(callNotificationID);
    }

    public boolean isCallNotificationShowed() {
        return isNotificationShowed;
    }

    public Notification createCallNotification(Context context) {
        String title = notificationTitle;
        String body = notificationMessage;

        String channelID = callNotificationChannelID;

        PendingIntent clickIntent = getClickIntent(context);
        PendingIntent acceptIntent = getAcceptIntent(context);
        PendingIntent declineIntent = getDeclineIntent(context);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            Notification.Builder builder = new Builder(context, channelID);
            builder.setSmallIcon(android.R.drawable.ic_menu_call);
            builder.setContentTitle(title);
            builder.setContentText(body);
            builder.setContentIntent(clickIntent);
            builder.setVisibility(Notification.VISIBILITY_PUBLIC);
            builder.setCategory(NotificationCompat.CATEGORY_CALL);
            builder.setAutoCancel(true);

            //callStyle need foreground service or fullscreen intent
            android.app.Person caller = new android.app.Person.Builder()
                .setName(title)
                .setImportant(true).build();
            Notification.CallStyle callStyle = Notification
                .CallStyle
                .forIncomingCall(caller, declineIntent, acceptIntent);
            builder.setStyle(callStyle);

            return builder.build();
        } else {
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelID);
            builder.setSmallIcon(android.R.drawable.ic_menu_call);
            builder.setContentTitle(title);
            builder.setContentText(body);
            builder.setContentIntent(clickIntent);
            builder.setPriority(NotificationCompat.PRIORITY_HIGH);
            builder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            builder.setCategory(NotificationCompat.CATEGORY_CALL);
            builder.setOngoing(true).setAutoCancel(true);
            builder.setSound(getRingtone(context, this.soundName));

            NotificationCompat.Action.Builder acceptAction = new Action.Builder(
                // The icon that will be displayed on the button (or not, depends on the Android version)
                null,
                // The text on the button
                incomingAcceptButtonText, acceptIntent);

            NotificationCompat.Action.Builder declineAction = new Action.Builder(
                // The icon that will be displayed on the button (or not, depends on the Android version)
                null,
                // The text on the button
                incomingDeclineButtonText, declineIntent);

            builder.addAction(acceptAction.build());
            builder.addAction(declineAction.build());
            return builder.build();
        }
    }

    private PendingIntent getAcceptIntent(Context context) {
        // remember action and start app, auto accept and start callInviteActivity
        Intent intent = new Intent(context, OffLineCallNotificationService.class);
        intent.setAction(ACTION_ACCEPT_CALL);

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= VERSION_CODES.M) {
            pendingIntent = PendingIntent.getService(context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            pendingIntent = PendingIntent.getService(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }
        return pendingIntent;
    }


    private PendingIntent getDeclineIntent(Context context) {
        Intent intent = new Intent(context, OffLineCallNotificationService.class);
        intent.setAction(ACTION_DECLINE_CALL);

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= VERSION_CODES.M) {
            pendingIntent = PendingIntent.getService(context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            pendingIntent = PendingIntent.getService(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }
        return pendingIntent;
    }

    private PendingIntent getClickIntent(Context context) {
        Intent intent = new Intent(context, OffLineCallNotificationService.class);
        intent.setAction(ACTION_CLICK);

        PendingIntent openIntent;
        if (Build.VERSION.SDK_INT >= VERSION_CODES.M) {
            openIntent = PendingIntent.getService(context, 0, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            openIntent = PendingIntent.getService(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }
        return openIntent;
    }
}
