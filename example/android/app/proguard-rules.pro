# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class **.zego.**  { *; }
-keep class **.**.zego_zpns.** { *; }

-keep class com.hiennv.flutter_callkit_incoming.SharedPreferencesUtils* {*;}
-keep class com.fasterxml.jackson.** {*;}

-dontwarn com.google.firebase.messaging.TopicOperation$TopicOperations
-dontwarn com.heytap.msp.push.**
-dontwarn com.huawei.hms.**
-dontwarn com.vivo.push.**
-dontwarn com.xiaomi.mipush.sdk.**
-dontwarn java.beans.ConstructorProperties
-dontwarn java.beans.Transient
-dontwarn org.w3c.dom.bootstrap.DOMImplementationRegistry
