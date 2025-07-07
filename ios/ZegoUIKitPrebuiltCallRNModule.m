#import "ZegoUIKitPrebuiltCallRNModule.h"
#import <AVFoundation/AVFoundation.h>
#import <UserNotifications/UserNotifications.h>
#import "LogManager.h"

@implementation ZegoUIKitPrebuiltCallRNModule

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"backgroundTimer.timeout"];
}

RCT_EXPORT_METHOD(setTimeout:(int)timeoutId
                     timeout:(double)timeout
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    __block UIBackgroundTaskIdentifier task = [[UIApplication sharedApplication] beginBackgroundTaskWithName:@"ZegoBackgroundTimer" expirationHandler:^{
        [[UIApplication sharedApplication] endBackgroundTask:task];
    }];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        if ([self bridge] != nil) {
            [self sendEventWithName:@"backgroundTimer.timeout" body:[NSNumber numberWithInt:timeoutId]];
        }
        [[UIApplication sharedApplication] endBackgroundTask:task];
    });
    resolve([NSNumber numberWithBool:YES]);
}

RCT_EXPORT_METHOD(changeToSpeaker) {
    NSError *error = NULL;
    
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    BOOL isSucc = [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord
                                withOptions:AVAudioSessionCategoryOptionAllowBluetooth | AVAudioSessionCategoryOptionDefaultToSpeaker
                                      error:&error];
    [self _logIfError:isSucc error:error prefix:@"[ZegoUIKitPrebuiltCallRNModule][changeToSpeaker] setCategory"];
}

RCT_EXPORT_METHOD(changeToReceiver) {
    BOOL isSucc = TRUE;
    NSError *error = NULL;

    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    isSucc = [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:&error];
    [self _logIfError:isSucc error:error prefix:@"[ZegoUIKitPrebuiltCallRNModule][changeToReceiver] setCategory"];

    error = NULL;
    isSucc = [audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:&error];
    [self _logIfError:isSucc error:error prefix:@"[ZegoUIKitPrebuiltCallRNModule][changeToReceiver] overrideOutputAudioPort"];
}

- (void)_logIfError:(BOOL)isSucc error:(NSError *)error prefix:(NSString *)logPrefix {
  NSString *logContent = NULL;
  
  if (isSucc) {
    logContent = [NSString stringWithFormat:@"%@ succ", logPrefix];
  } else if (error != NULL) {
    logContent = [NSString stringWithFormat:@"%@ fail, error: %ld, desc: %@", logPrefix, error.code, error.localizedDescription];
  } else {
    logContent = [NSString stringWithFormat:@"%@ fail, unknown reason", logPrefix];
  }
  
  [[LogManager sharedInstance] writeToLog:logContent appendTime:YES flush:NO];
}

// Not necessary, because iOS background and offline notifications do not require notification permissions.
// Keep this function just to align with the same-named module on the Android side to avoid execution exceptions.
RCT_EXPORT_METHOD(areNotificationsEnabled:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        if (settings.authorizationStatus == UNAuthorizationStatusNotDetermined || settings.authorizationStatus == UNAuthorizationStatusDenied)
        {
            resolve(@(FALSE));
        } else {
            resolve(@(TRUE));
        }
    }];
}

@end
