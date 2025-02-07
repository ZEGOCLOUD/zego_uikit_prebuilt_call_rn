import { AppState } from 'react-native';
// @ts-ignore
import { setCategory } from 'react-native-sound';
import uuid from 'react-native-uuid';

import ZegoUIKit, { CXAction, CXCallUpdate, ZegoPluginResult } from '@zegocloud/zego-uikit-rn';
import { ZIMError } from 'zego-zim-react-native';

import ZegoUIKitPrebuiltCallService from '../../services';
import { zlogerror, zloginfo } from '../../utils/logger';
import PrebuiltCallReport from '../../utils/report';
import CallInviteHelper from './call_invite_helper';
import { ZegoInvitationType } from './defines';
import InnerTextHelper from './inner_text_helper';
import ZegoPrebuiltPlugins from './plugins';

export type CallStatus = 'waiting' | 'notification' | 'calling';

export default class NotificationHelper {
    TAG = 'NotificationHelper';
    static _instance: NotificationHelper;

    _signalingPlugin = ZegoUIKit.getSignalingPlugin()
    _uikitSignalingPlugin = ZegoUIKit.getSignalingPlugin().getZegoUIKitSignalingPlugin().getInstance()
    _callbackID = `${this.TAG}_${String(Math.floor(Math.random() * 10000))}`

    _callData = {};
    _callIDUuidMap = new Map<string, string>();
    _currentCallID = '';
    _currentCallStatus: CallStatus = 'waiting'

    constructor() {
        AppState.addEventListener('change', async nextState => {
            zloginfo('nextState', nextState);
            if (nextState === 'active') {
                this.dismissNotification(this._currentCallID, 'active', this.TAG)
            }
        });
    }
    static getInstance() {
        return this._instance || (this._instance = new NotificationHelper());
    }

    init() {
        zloginfo(`[NotificationHelper][init]`)

        this._uikitSignalingPlugin.onCallKitEndCall(this._onCallKitEndCall.bind(this))
        zloginfo(`[NotificationHelper][init] set onCallKitEndCall`)

        this._uikitSignalingPlugin.onCallKitAnswerCall(this._onCallKitAnswerCall.bind(this))
        zloginfo(`[NotificationHelper][init] set onCallKitAnswerCall`)
    }

    // for offline call
    showOfflineNotification(callID: string, callUUID: string, callData: any) {
        if (!callData) {
            zlogerror('[NotificationHelper][showOfflineNotification] callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][showOfflineNotification] callID: ${callID}, callUUID: ${callUUID}, callData: ${JSON.stringify(callData)}`)

        let notifyUuid = this._callIDUuidMap.get(callID);
        if (notifyUuid) {
            zloginfo(`[NotificationHelper][showOfflineNotification] callID: ${callID} ignore, already shown notification`)
            this._uikitSignalingPlugin.reportCallKitCallEnded(callUUID, 2)    // 2 - RemoteEnded
            return
        }
        this._callIDUuidMap.set(callID, callUUID)

        let { call_id: roomID, type, inviter, invitees } = callData;

        if (this._currentCallID && this._currentCallStatus === 'notification') {
            zloginfo(`[NotificationHelper][showOfflineNotification] another call is showing`)

            this._refuse(undefined, callID, roomID, inviter, 'busy', 'restarted')
            this._uikitSignalingPlugin.reportCallKitCallEnded(callUUID, 2)    // 2 - RemoteEnded

            PrebuiltCallReport.reportEvent('call/respondInvitation', {
                'call_id': callID,
                'app_state': 'restarted',
                'action': 'busy'
            })
            return;
        }

        this._currentCallID = callID
        this._currentCallStatus = 'notification'
        zloginfo(`[NotificationHelper][showOfflineNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
        
        zloginfo(`[NotificationHelper][showOfflineNotification] displayIncomingCall callID: ${callID}`)

        // callID mean zim callID
        this._callData = { callID, roomID, type, inviter, invitees, isPureOfflinePush: true }
        zloginfo(`[NotificationHelper][showOfflineNotification] _callData: ${JSON.stringify(this._callData)}`)
    }

    // for online call when background
    showOnlineNotification(callID: string, callData: any) {
        let notifyUuid = this._callIDUuidMap.get(callID);
        if (notifyUuid) {
            zloginfo(`[NotificationHelper][showOnlineNotification] callID: ${callID} ignore, already shown notification`)
            return
        }

        if (!callData) {
            zlogerror('[NotificationHelper][showOnlineNotification] _callData is empty')
            return
        }

        // @ts-ignore
        let { roomID, type, inviter, invitees } = callData;

        zloginfo(`[NotificationHelper][showOnlineNotification] callID: ${callID}, roomID: ${roomID}, isVideoCall: ${type}, inviter: ${JSON.stringify(inviter)}, invitees: ${JSON.stringify(invitees)}`)
        
        notifyUuid = uuid.v4();
        zloginfo(`[NotificationHelper][showOnlineNotification] reportIncomingCall callID: ${callID}, uuid: ${notifyUuid}`)

        const callerName = InnerTextHelper.instance().getIncomingCallDialogTitle(inviter.name, type, invitees.length);
        zloginfo(`[NotificationHelper][showOnlineNotification], callerName: ${callerName}`);
        
        let cxCallUpdate = { } as CXCallUpdate;
        cxCallUpdate.localizedCallerName = callerName
        cxCallUpdate.hasVideo = (type === ZegoInvitationType.videoCall)
        this._uikitSignalingPlugin.reportIncomingCall(cxCallUpdate, notifyUuid);
        zloginfo(`[NotificationHelper][showOnlineNotification] reportIncomingCall callID: ${callID}`)
        
        this._currentCallID = callID
        this._currentCallStatus = 'notification'
        zloginfo(`[NotificationHelper][showOnlineNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

        this._callIDUuidMap.set(callID, notifyUuid)
        zloginfo(`[NotificationHelper][showOnlineNotification] set ${callID} into _callIDUuidMap`)

        PrebuiltCallReport.reportEvent('call/displayNotification', {
            'call_id': callID,
            'app_state': AppState.currentState
        })

        this._callData = { callID, roomID, type, inviter, invitees }
        zloginfo(`[NotificationHelper][showOnlineNotification] _callData: ${JSON.stringify(this._callData)}`)
    }

    dismissNotification(callID: string, reason: string, from: string) {
        zloginfo(`[NotificationHelper][dismissNotification] callID: ${callID}, reason: ${reason}, from: ${from}`)

        if (reason === 'active') {
            // Handed over to the active state for handling
            let notifyUuid = this._callIDUuidMap.get(callID);
            if (notifyUuid) {
                this._uikitSignalingPlugin.reportCallKitCallEnded(notifyUuid, 2)    // 2 - RemoteEnded
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][dismissNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
            }
        } else if (reason === 'BeCancelled' || reason === 'Timeout') {
            if (callID !== this._currentCallID) {
                zloginfo(`[NotificationHelper][dismissNotification] ignore callID: ${callID}`)
                return
            }
    
            let notifyUuid = this._callIDUuidMap.get(callID);
            if (notifyUuid) {
                this._uikitSignalingPlugin.reportCallKitCallEnded(notifyUuid, 2)    // 2 - RemoteEnded
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][dismissNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

                PrebuiltCallReport.reportEvent('call/respondInvitation', {
                    'call_id': callID,
                    'app_state': AppState.currentState,
                    'action': reason
                })
            }
        }
    }

    _onCallKitEndCall(action: CXAction) {
        if (!this._callData) {
            zlogerror('[NotificationHelper][_onCallKitEndCall] _callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][_onCallKitEndCall] callData: ${JSON.stringify(this._callData)}, state: ${AppState.currentState}`)
        
        // Offline incoming calls are not supported (too early), and online incoming calls rely on ZegoCallInvitationDialog
        // CallEventNotifyApp.getInstance().notifyIncomingCallDeclineButtonPressed()
        
        if (this._currentCallID && this._currentCallStatus === 'calling') {
            // click accept and hangup
            this.hangUp(this._currentCallID, 'onCallKitEndCall')
            zloginfo(`[NotificationHelper][_onCallKitEndCall] hangUp`)
            this._currentCallID = ''
            this._currentCallStatus = 'waiting'
            zloginfo(`[NotificationHelper][_onCallKitEndCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

            action.fulfill();
        } else {
            // click decline button from notification
        
            // @ts-ignore
            let { callID, roomID, inviter } = this._callData;
            this._callData = undefined

            zloginfo(`[NotificationHelper][_onCallKitEndCall] will refuse after signalingPlugin login succ, callbackID: ${this._callbackID}`)
            this._refuse(action, callID, roomID, inviter, 'refuse', AppState.currentState)
        }
    }

    _refuse(action: CXAction, callID: string, roomID: string, inviter: any, reason: string, appState: string) {
        this._signalingPlugin.onLoginSuccess(this._callbackID, () => {
            // tell caller
            this._signalingPlugin.refuseInvitation(inviter.id, JSON.stringify({
                callID, 
                call_id: roomID,
                // @ts-ignore
                'invitee': {userID: ZegoPrebuiltPlugins.getLocalUser().userID, userName: ZegoPrebuiltPlugins.getLocalUser().userName}
            }))
            .then((result: ZegoPluginResult) => {
                zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation then, code: ${result.code}, message: ${result.message}`)

                PrebuiltCallReport.reportEvent('call/respondInvitation', {
                    'call_id': callID,
                    'app_state': appState,
                    'action': reason
                })
        
                CallInviteHelper.getInstance().refuseCall(callID);
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][_onCallKitEndCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

                // tell ios decline completion
                if (action) {
                    action.fulfill();
                }
            })
            .catch((error: ZIMError) => {
                zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation catch, error: ${error.code}, message: ${error.message}`)

                CallInviteHelper.getInstance().refuseCall(callID);
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][_onCallKitEndCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

                // tell ios decline fail
                if (action) {
                    action.fail();
                }
            })

            this._signalingPlugin.onLoginSuccess(this._callbackID)
        })
    }

    _onCallKitAnswerCall(action: CXAction) {
        if (!this._callData) {
            zlogerror('[NotificationHelper][_onCallKitAnswerCall] _callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][_onCallKitAnswerCall] callData: ${JSON.stringify(this._callData)}, state: ${AppState.currentState}`)

        // @ts-ignore
        let { callID, roomID, type, inviter, invitees, isPureOfflinePush } = this._callData;
        // this._callData = undefined   // Do not clear it, as it will still be needed when the VoIP call is hangup later.

        zloginfo(`[NotificationHelper][_onCallKitAnswerCall] will accept after signalingPlugin login succ, callbackID: ${this._callbackID}`)
        this._signalingPlugin.onLoginSuccess(this._callbackID, () => {
            let app_state: string = AppState.currentState
            if (isPureOfflinePush) {
                CallInviteHelper.getInstance().setOfflineData({call_id: roomID, type, inviter, invitees});
                app_state = "restarted"
            }

            setCategory('PlayAndRecord');
            CallInviteHelper.getInstance().acceptCall(callID, {call_id: roomID, type, inviter, invitees});
            ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id, JSON.stringify({
                callID, 
                call_id: roomID,
                // @ts-ignore
                'invitee': {userID: ZegoPrebuiltPlugins.getLocalUser().userID, userName: ZegoPrebuiltPlugins.getLocalUser().userName}
            }))
            .then((result: ZegoPluginResult) => {
                zloginfo(`[NotificationHelper][_onCallKitAnswerCall] acceptInvitation then, code: ${result.code}, message: ${result.message}`)

                PrebuiltCallReport.reportEvent('call/respondInvitation', {
                    'call_id': callID,
                    app_state,
                    'action': 'accept'
                })

                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][_onCallKitAnswerCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

                if (AppState.currentState === 'background') {
                    this._currentCallID = callID
                    this._currentCallStatus = 'calling'
                    zloginfo(`[NotificationHelper][_onCallKitAnswerCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
                }

                action.fulfill();
            })
            .catch((error: ZIMError) => {
                zloginfo(`[NotificationHelper][_onCallKitAnswerCall] acceptInvitation catch, error: ${error.code}, message: ${error.message}`)

                CallInviteHelper.getInstance().refuseCall(callID);
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][_onCallKitAnswerCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

                // tell ios decline fail
                action.fail();
            })
        })
    }

    hangUp(callID: string, reason: string) {
        if (reason === 'onCallKitEndCall') {
            ZegoUIKitPrebuiltCallService.getInstance().hangUp();
        } else {
            let notifyUuid = this._callIDUuidMap.get(callID);
            if (notifyUuid) {
                this._uikitSignalingPlugin.reportCallKitCallEnded(notifyUuid, 2)    // 2 - RemoteEnded
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][hangUp] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
            }
        }
    }

    getCurrentInCallID() {
        if (this._currentCallStatus === 'calling') {
            return this._currentCallID;
        } else {
            return ''
        }
    }
}