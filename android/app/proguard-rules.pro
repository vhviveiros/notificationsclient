# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep your app's own classes
-keep class com.notificationsclient.** { *; }

# Hermes
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.hermes.** { *; }

# Needed for debugging
-keepattributes SourceFile,LineNumberTable

# Remove all debug logs
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Remove Kotlin metadata
-dontwarn kotlin.**

# Remove unused React Native classes
-keep class com.facebook.react.devsupport.** { *; }
-dontwarn com.facebook.react.devsupport.**

# Remove development modules
-keep class com.facebook.react.modules.systeminfo.** { *; }
-dontwarn com.facebook.react.modules.systeminfo.**

# Remove console statements from release builds
-assumenosideeffects class com.facebook.common.logging.FLog {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Optimize native libraries
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

# Remove more debugging info
-keepattributes *Annotation*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# Optimize JSON
-keepclassmembers class * {
    @com.facebook.react.bridge.ReadableArray *;
    @com.facebook.react.bridge.WritableArray *;
    @com.facebook.react.bridge.ReadableMap *;
    @com.facebook.react.bridge.WritableMap *;
}
