import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { AppState, Platform, NativeModules, AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import InnerTextHelper from '../services/inner_text_helper';
import RNCallKeep from 'react-native-callkeep'
import CallInviteHelper from './call_invite_helper'

const rnCallKeepPptions = {
    ios: {
        appName: 'My app name',
        handleType: 'generic',
        includesCallsInRecents: false
    },
    android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'OK',
        // Required to get audio in background when using Android 11
        foregroundService: {
            channelId: 'ZegoUIKitPrebuiltCallOfflineDataChannel',
            channelName: 'Foreground service for my app',
            notificationTitle: 'My app is running on background',
            notificationIcon: 'Path to the resource icon of the notification',
        }
    }
};

export default class OfflineCallEventListener {
    _instance;
    callbackID = 'OfflineCallEventListener ' + String(Math.floor(Math.random() * 10000));
    config = {};
    _currentCallData = {};

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new OfflineCallEventListener());
    }
    usingSystemCallUI(signalingPlugin) {
        signalingPlugin.getInstance().setAndroidOfflineDataHandler((data) => {
            console.log('OfflineDataHandler: ', data)


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

            RNCallKeep.displayIncomingCall(data.call_id, data.inviter.id, data.inviter.name, 'generic', true);
        })

        signalingPlugin.getInstance().setIOSOfflineDataHandler((data, callUUID) => {
            console.log('#####setIOSOfflineDataHandler1111: ', data, AppState.currentState);
            // This cannot be written in the answer call, dialog cannot get
            signalingPlugin.getInstance().onCallKitAnswerCall(() => {
                console.log('#####onCallKitAnswerCall2222', data, callUUID, this._currentCallData);
                signalingPlugin.getInstance().reportCallKitCallEnded(callUUID);
                CallInviteHelper.getInstance().setOfflineData(data);

                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                if (this._currentCallData && this._currentCallData.inviter) {
                    // If you kill the application, you do not need to process it, and this value is also empty
                    CallInviteHelper.getInstance().acceptCall(callUUID, this._currentCallData);
                    ZegoUIKit.getSignalingPlugin().acceptInvitation(this._currentCallData.inviter.id, undefined)
                }
            });
            signalingPlugin.getInstance().onCallKitEndCall(() => {
                console.log('######onCallKitEndCall', callUUID, this._currentCallData);
                if (this._currentCallData && this._currentCallData.inviter) {
                    ZegoUIKit.getSignalingPlugin().refuseInvitation(this._currentCallData.inviter.id, undefined).then(() => {
                        CallInviteHelper.getInstance().refuseCall(callUUID);
                    });
                }
            })
        });
    }
    init(config) {
        console.log('######OfflineCallEventListener init');
        this.config = config;
        this.registerCallback();

        // Setup for background invitation
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
            CallInviteHelper.getInstance().acceptCall(callUUID, this._currentCallData);
            ZegoUIKit.getSignalingPlugin().acceptInvitation(this._currentCallData.inviter.id, undefined)
        });
        RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
            CallInviteHelper.getInstance().refuseCall(callUUID);
            ZegoUIKit.getSignalingPlugin().refuseInvitation(this._currentCallData.inviter.id, undefined)
        });
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
            }
            const invitees = this.getInviteesFromData(data)
            // Listen and show notification on background
            this.showBackgroundNotification(callID, inviter.name, type, invitees)
            if (typeof onIncomingCallReceived == 'function') {
                onIncomingCallReceived(callID, { userID: inviter.id, userName: inviter.name }, type, invitees)
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
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
        } = this.config;

        if (AppState.currentState != "background" || Platform.OS == 'ios') {
            return;
        }

        var shouldUseRNCallKeep = true;
        if (Platform.OS === "android" && parseInt(Platform.constants['Release']) < 8) {
            shouldUseRNCallKeep = false;
        }
        if (shouldUseRNCallKeep) {
            RNCallKeep.displayIncomingCall(callID, inviterName, inviterName, 'generic', true);
        } else {
            notifee.displayNotification({
                title: InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, count),
                body: InnerTextHelper.instance().getIncomingCallDialogMessage(type, count),
                data: {},
                android: {
                    channelId: androidNotificationConfig.channelID,
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
    }
}