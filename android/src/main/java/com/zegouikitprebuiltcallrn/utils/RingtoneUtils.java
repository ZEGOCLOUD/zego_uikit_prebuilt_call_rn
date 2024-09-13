package com.zegouikitprebuiltcallrn.utils;

import android.content.Context;
import android.media.RingtoneManager;
import android.net.Uri;
import android.text.TextUtils;

public class RingtoneUtils {
    public static Uri getRingtone(Context context, String soundName) {
        String soundSource = "resource://raw/" + getSoundName(soundName);
        Uri ringtone = retrieveSoundResourceUri(context, soundSource);
        return ringtone;
    }

    private static String getSoundName(String sound) {
        if (TextUtils.isEmpty(sound)) {
            return "zego_incoming";
        }
        String[] splits = sound.split("\\.");
        String suffixStr = "";
        if (splits != null && splits.length > 1) {
            suffixStr = sound.substring(0, sound.length() - (splits[splits.length - 1].length() + 1));
        } else {
            suffixStr = sound;
        }
        return suffixStr;
    }

    private static Uri retrieveSoundResourceUri(Context context, String soundSource) {
        Uri uri = null;
        if (TextUtils.isEmpty(soundSource)) {
            uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        } else {
            int soundResourceId = AudioUtils.getAudioResourceId(context, soundSource);
            if (soundResourceId > 0) {
                uri = Uri.parse("android.resource://" + context.getPackageName() + "/" + soundResourceId);
            } else {
                uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
        }
        return uri;
    }
}
