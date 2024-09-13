package com.zegouikitprebuiltcallrn.utils;

import android.util.Log;

import com.elvishew.xlog.XLog;

public class XLogWrapper {
    private static Object[] insertArgument(Object[] args, Object newArg) {
        Object[] newArray = new Object[args.length + 1];
        newArray[0] = newArg;
        if (args.length > 0) {
            System.arraycopy(args, 0, newArray, 1, args.length);
        }
        return newArray;
    }

    public static void i(String tag, String format, Object... args) {
        XLog.i(String.format("[%s] " + format, insertArgument(args, tag)));

        Log.i(tag, String.format(format, args));
    }
}
