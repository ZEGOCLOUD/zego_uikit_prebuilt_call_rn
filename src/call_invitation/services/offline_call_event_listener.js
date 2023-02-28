import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { AppState, Platform } from 'react-native';
import notifee from '@notifee/react-native';
import InnerTextHelper from '../services/inner_text_helper';

export default class OffineCallEventListener {
    _instance;
    callbackID = 'OffineCallEventListener ' + String(Math.floor(Math.random() * 10000));
    config = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new OffineCallEventListener());
    }
    init(config) {
        console.log('######OffineCallEventListener init');
        this.config = config;
        this.registerCallback();
    }
    uninit() {
        console.log('######OffineCallEventListener uninit');
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
            const invitees = this.getInviteesFromData(data)
            // Listen and show notification on background
            this.showBackgroundNotification(inviter.name, type, invitees)
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
    showBackgroundNotification(inviterName, type, invitees) {
        const count = invitees ? invitees.length : 0;
        const {
            androidNotificationConfig,
        } = this.config;
    
        if (AppState.currentState != "background" || Platform.OS == 'ios') {
            return;
        }
        notifee.displayNotification({
            title: InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, count),
            body: InnerTextHelper.instance().getIncomingCallDialogMessage(type, count),
            data: {},
            android: {
                channelId: androidNotificationConfig.channelID,
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