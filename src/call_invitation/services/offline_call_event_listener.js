import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { AppState, Platform, NativeModules, NativeEventEmitter, AppRegistry } from 'react-native';
import notifee, { AndroidImportance, AndroidCategory, AndroidVisibility } from '@notifee/react-native';
import InnerTextHelper from '../services/inner_text_helper';
import RNCallKeep from '@zegocloud/react-native-callkeep';
import CallInviteHelper from './call_invite_helper';
// import GetAppName from 'react-native-get-app-name';
import { zlogerror, zloginfo, zlogwarning } from '../../utils/logger';

const rnCallKeepPptions = {
    ios: {
        appName: 'My app', // required
        handleType: 'generic',
        includesCallsInRecents: false,
    },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'OK',
        // Required to get audio in background when using Android 11
        foregroundService: {
            channelId: 'ZegoUIKitPrebuiltCallOfflineDataChannel',
            channelName: 'Foreground service for Call Kit',
            notificationTitle: 'My app is running on background',
        }
    }
};
const SYSTEM_CALL_FALLBACK_NOTIFICATION_CHANNEL_ID = "call_kit_fallback_notification"
const SYSTEM_CALL_FALLBACK_NOTIFICATION_CHANNEL_NAME = "Call Kit Fallback Notification"

export default class OfflineCallEventListener {
    _instance;
    callbackID = 'OfflineCallEventListener ' + String(Math.floor(Math.random() * 10000));
    config = {};
    _currentCallData = {};
    _isSystemCalling = false;

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new OfflineCallEventListener());
    }

    displayNotification(channelID, inviterName, type, inviteesCount) {
        notifee.displayNotification({
            title: InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, inviteesCount),
            body: InnerTextHelper.instance().getIncomingCallDialogMessage(type, inviteesCount),
            data: {},
            android: {
                channelId: channelID,
                category: AndroidCategory.CALL,
                importance: AndroidImportance.HIGH,
                // Launch the app on lock screen
                fullScreenAction: {
                    // For Android Activity other than the default:
                    id: 'full_screen_body_press',
                    launchActivity: 'default',
                },
                pressAction: {
                    id: 'body_press',
                    launchActivity: 'default',
                },
            },
        });
    }
    useSystemCallingUI(plugins = []) {
        this._isSystemCalling = true;
        // GetAppName.getAppName((appName) => {
        // console.log("[useSystemCallingUI]Here is your app name:", appName)    
        // this.updateAppName(appName);
        // })
        ZegoUIKit.installPlugins(plugins);
        const signalingPlugin = ZegoUIKit.getSignalingPlugin().getZegoUIKitSignalingPlugin();

        signalingPlugin.getInstance().setBackgroundMessageHandler();

        signalingPlugin.getInstance().setAndroidOfflineDataHandler((data) => {
            console.log('OfflineDataHandler: ', data, rnCallKeepPptions);
            const cancelInvitation = data && data.operation_type === "cancel_invitation"

            if (Platform.OS === "android" && parseInt(Platform.constants['Release']) < 8) {
                if (cancelInvitation) {
                    notifee.cancelAllNotifications();
                } else {
                    const inviteesCount = data.invitees.length;
                    this.displayNotification(SYSTEM_CALL_FALLBACK_NOTIFICATION_CHANNEL_ID, data.inviter.name, data.type, inviteesCount);
                }
            } else {
                if (cancelInvitation) {
                    RNCallKeep.reportEndCallWithUUID(data.call_id, 6);
                } else {
                    // It need to be setup again for offline call
                    RNCallKeep.setup(rnCallKeepPptions).then(accepted => { });
                    RNCallKeep.setAvailable(true)

                    RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
                        RNCallKeep.endAllCalls();
                        // RNCallKeep.backToForeground()
                        if (Platform.OS === "android") {
                            const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;
                            ZegoUIKitPrebuiltCallRNModule.startActivity();
                        }

                        // When the app launch, ZIM will send the online invite again
                        // Then we can read the offline data to decide if need to join the room directly
                        CallInviteHelper.getInstance().setOfflineData(data);
                    });

                    RNCallKeep.displayIncomingCall(data.call_id, data.inviter.name, data.inviter.name, 'generic', true);
                }
            }

        })

        signalingPlugin.getInstance().setIOSOfflineDataHandler((data, callUUID) => {
            CallInviteHelper.getInstance().setOfflineData(undefined)
            zloginfo("setIOSOfflineDataHandler", callUUID, data)


            CallInviteHelper.getInstance().setCurrentCallUUID(callUUID);
            // This cannot be written in the answer call, dialog cannot get
            signalingPlugin.getInstance().onCallKitAnswerCall((action) => {
                zloginfo("onCallKitAnswerCall", data)
                // The report succeeds regardless of the direct service scenario
                action.fulfill();
                // if (AppState.currentState !== 'background') {
                //     signalingPlugin.getInstance().reportCallKitCallEnded(callUUID);
                // }
                CallInviteHelper.getInstance().setOfflineData(data);

                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                if (data && data.inviter) {
                    // If you kill the application, you do not need to process it, and this value is also empty
                    if (this._currentCallData && this._currentCallData.callID) {
                        CallInviteHelper.getInstance().acceptCall(this._currentCallData.callID, data);
                        ZegoUIKit.getSignalingPlugin().acceptInvitation(data.inviter.id, undefined)
                        this._currentCallData = {}
                    }
                }
            });
            signalingPlugin.getInstance().onCallKitEndCall((action) => {
                // The report succeeds regardless of the direct service scenario
                action.fulfill();
                console.log('######onCallKitEndCall', callUUID);
                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                if (data && data.inviter) {
                    if (this._currentCallData && this._currentCallData.callID) {
                        ZegoUIKit.getSignalingPlugin().refuseInvitation(data.inviter.id, undefined).then(() => {
                            CallInviteHelper.getInstance().refuseCall(this._currentCallData.callID);
                            this._currentCallData = {}
                        });
                    }
                }
            })
        });
    }
    init(config) {
        console.log('######OfflineCallEventListener init', config);
        this.config = config;
        this.registerCallback();

        // Setup for background invitation
        if (!config.notifyWhenAppRunningInBackgroundOrQuit || !this._isSystemCalling) return;

        const {
            ringtoneConfig,
            androidNotificationConfig,
        } = this.config;

        if (!ringtoneConfig) {
            zlogerror('ringtoneConfig is required for calling notification');
        }
        if (Platform.OS === "android") {
            if (!androidNotificationConfig) {
                zlogerror('androidNotificationConfig is required for calling notification');
            }
        }
        if (!this._isSystemCalling) {
            // Create channel for normal call notification
            notifee.createChannel({
                id: androidNotificationConfig.channelID,
                name: androidNotificationConfig.channelName,
                badge: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: ringtoneConfig.incomingCallFileName.split('.')[0]
            });
        }

        if (Platform.OS === "android" && parseInt(Platform.constants['Release']) < 8) {

            // Create channel for system style incoming call fallback notification
            notifee.createChannel({
                id: SYSTEM_CALL_FALLBACK_NOTIFICATION_CHANNEL_ID,
                name: SYSTEM_CALL_FALLBACK_NOTIFICATION_CHANNEL_NAME,
                badge: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: ringtoneConfig.incomingCallFileName.split('.')[0]
            })
        } else {
            RNCallKeep.setup(rnCallKeepPptions).then(accepted => { });

            RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
                RNCallKeep.endAllCalls();
                // RNCallKeep.backToForeground()
                if (Platform.OS === "android") {
                    const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;
                    ZegoUIKitPrebuiltCallRNModule.startActivity();
                }

                console.log('Answer call on background mode: ', callUUID, this._currentCallData)
                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                CallInviteHelper.getInstance().acceptCall(this._currentCallData.callID, this._currentCallData);
                ZegoUIKit.getSignalingPlugin().acceptInvitation(this._currentCallData.inviter.id, undefined)
            });
            RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
                CallInviteHelper.getInstance().refuseCall(this._currentCallData.callID);
                ZegoUIKit.getSignalingPlugin().refuseInvitation(this._currentCallData.inviter.id, undefined)
            });
        }

        // AppState.addEventListener('change', nextState => {
        //     console.log('nextState', nextState);
        // });
    }
    uninit() {
        console.log('######OfflineCallEventListener uninit');
        this.unregisterCallback();
    }
    registerCallback() {
        const callbackID = this.callbackID;
        const {
            onOutgoingCallTimeout,
            onOutgoingCallRejectedCauseBusy,
            onOutgoingCallDeclined,
            onOutgoingCallAccepted,
            onIncomingCallReceived,
            onIncomingCallCanceled,
            onIncomingCallTimeout,
        } = this.config;
        ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, ({ callID, invitees, data }) => {
            if (typeof onOutgoingCallTimeout == 'function') {
                onOutgoingCallTimeout(callID, invitees.map((invitee) => {
                    return { userID: invitee.id, userName: invitee.name }
                }))
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
            const jsonData = data ? JSON.parse(data) : undefined;
            if (jsonData && jsonData.reason == 'busy') {
                if (typeof onOutgoingCallRejectedCauseBusy == 'function') {
                    onOutgoingCallRejectedCauseBusy(callID, { userID: invitee.id, userName: invitee.name })
                }
            } else {
                if (typeof onOutgoingCallDeclined == 'function') {
                    onOutgoingCallDeclined(callID, { userID: invitee.id, userName: invitee.name })
                }
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ callID, invitee, data }) => {
            if (typeof onOutgoingCallAccepted == 'function') {
                onOutgoingCallAccepted(callID, { userID: invitee.id, userName: invitee.name })
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }) => {
            this._currentCallData = {
                ...JSON.parse(data),
                type,
                inviter,
                callID,
            }
            const invitees = this.getInviteesFromData(data)
            // Listen and show notification on background
            this.showBackgroundNotification(callID, inviter.name, type, invitees)
            if (typeof onIncomingCallReceived == 'function') {
                onIncomingCallReceived(callID, { userID: inviter.id, userName: inviter.name }, type, invitees)
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
            // We need to close the callkit window
            if (AppState.currentState == "background" || Platform.OS == 'ios') {
                ZegoUIKit.getSignalingPlugin().reportZPNsCallKitCallEnded(CallInviteHelper.getInstance().getCurrentCallUUID(), 2) // RemoteEnded = 2
            }
            if (typeof onIncomingCallCanceled == 'function') {
                onIncomingCallCanceled(callID, { userID: inviter.id, userName: inviter.name })
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter, data }) => {
            if (typeof onIncomingCallTimeout == 'function') {
                onIncomingCallTimeout(callID, { userID: inviter.id, userName: inviter.name })
            }
        });
    }
    unregisterCallback() {
        const callbackID = this.callbackID;
        ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID);
        ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
        ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
        ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID);
        ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID);
        ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID);
    }
    updateAppName(appName) {
        if (appName) {
            rnCallKeepPptions.ios.appName = appName;
            rnCallKeepPptions.android.foregroundService.channelName =
                rnCallKeepPptions.android.foregroundService.channelName.replace('my app', appName);
            rnCallKeepPptions.android.foregroundService.notificationTitle =
                rnCallKeepPptions.android.foregroundService.notificationTitle.replace('My app', appName);
        }
    }
    getInviteesFromData(data) {
        const invitees = JSON.parse(data).invitees;
        return invitees.map((invitee) => {
            return { userID: invitee.user_id, userName: invitee.user_name };
        });
    }
    showBackgroundNotification(callID, inviterName, type, invitees) {
        const count = invitees ? invitees.length : 0;

        const {
            androidNotificationConfig,
            notifyWhenAppRunningInBackgroundOrQuit,
        } = this.config;

        if (AppState.currentState != "background" || Platform.OS == 'ios') {
            return;
        }

        var shouldUseRNCallKeep = true;
        if (Platform.OS === "android" && parseInt(Platform.constants['Release']) < 8) {
            shouldUseRNCallKeep = false;
        }
        if (shouldUseRNCallKeep && notifyWhenAppRunningInBackgroundOrQuit && this._isSystemCalling) {
            RNCallKeep.displayIncomingCall(callID, inviterName, inviterName, 'generic', true);
        } else {
            this.displayNotification(androidNotificationConfig.channelID, inviterName, type, count)
        }
    }
}