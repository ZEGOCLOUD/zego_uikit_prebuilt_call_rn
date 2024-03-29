#import "ZegoUIKitPrebuiltCallRNModule.h"

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

@end
