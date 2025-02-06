import { AppState, NativeEventEmitter, NativeModules } from 'react-native';

import ZegoUIKit, { ZegoPluginResult } from '@zegocloud/zego-uikit-rn';
import { ZIMError } from 'zego-zim-react-native';

import { zlogerror, zloginfo } from '../../utils/logger';
import PrebuiltCallReport from '../../utils/report';
import CallInviteHelper from './call_invite_helper';
import InnerTextHelper from './inner_text_helper';
import ZegoPrebuiltPlugin from './plugins'

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(ZegoUIKitPrebuiltCallRNModule);

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
    _alreadyInit = false
    _plugins: [] = []

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

    init(plugins?: any) {
        if (this._alreadyInit) {
            return
        }

        zloginfo(`[NotificationHelper][init]`)
        this._plugins = plugins

        eventEmitter.addListener('RNCallKitPerformEndCallAction', (data) => {
            zloginfo(`[EventListener] receive RNCallKitPerformEndCallAction from NativeModule, action: ${data}`)
            this._onCallKitEndCall(data)
        });
        zloginfo(`[NotificationHelper][init] set onCallKitEndCall`)

        eventEmitter.addListener('RNCallKitPerformAnswerCallAction', (data) => {
            zloginfo(`[EventListener] receive RNCallKitPerformAnswerCallAction from NativeModule, action: ${data}`)
            this._onCallKitAnswerCall()
        });
        zloginfo(`[NotificationHelper][init] set onCallKitAnswerCall`)

        this._alreadyInit = true
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
            return
        }
        this._callIDUuidMap.set(callID, callUUID)

        let { call_id: roomID, call_name, type, inviter, invitees, timeout } = callData;

        if (this._currentCallID && this._currentCallStatus === 'notification') {
            zloginfo(`[NotificationHelper][showOfflineNotification] another call is showing`)

            this._signalingPlugin.refuseInvitation(inviter.id, JSON.stringify({callID}));

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

        CallInviteHelper.getInstance().setOfflineData(undefined)

        // callID mean zim callID
        this._callData = { callID, roomID, call_name, type, inviter, invitees, isPureOfflinePush: true }
        zloginfo(`[NotificationHelper][showOfflineNotification] _callData: ${JSON.stringify(this._callData)}`)

        const callerName = call_name ?? InnerTextHelper.instance().getIncomingCallDialogTitle(inviter.name, type, invitees.length);
        const message = InnerTextHelper.instance().getIncomingCallDialogMessage(type, invitees.length);
        zloginfo(`[NotificationHelper][showOfflineNotification], callerName: ${callerName}, message: ${message}`);

        ZegoUIKitPrebuiltCallRNModule.displayIncomingCall(callID, callerName, message, timeout ?? 60);
        zloginfo(`[NotificationHelper][showOfflineNotification] displayIncomingCall callID: ${callID}`)
    }

    // for online call when background
    showOnlineNotification(callID: string, callData: any) {
        let notifyTag = this._callIDUuidMap.get(callID);
        if (notifyTag) {
            zloginfo(`[NotificationHelper][showOnlineNotification] callID: ${callID} ignore, already shown notification`)
            return
        }

        if (!callData) {
            zlogerror('[NotificationHelper][showOnlineNotification] _callData is empty')
            return
        }

        // @ts-ignore
        let { roomID, type, inviter, invitees, timeout } = callData;
        zloginfo(`[NotificationHelper][showOnlineNotification] callID: ${callID}, roomID: ${roomID}, isVideoCall: ${type}, inviter: ${JSON.stringify(inviter)}, invitees: ${JSON.stringify(invitees)}, timeout: ${timeout}`)
        
        const callerName = InnerTextHelper.instance().getIncomingCallDialogTitle(inviter.name, type, invitees.length);
        const message = InnerTextHelper.instance().getIncomingCallDialogMessage(type, invitees.length);
        zloginfo(`[NotificationHelper][showOnlineNotification], callerName: ${callerName}, message: ${message}`);

        ZegoUIKitPrebuiltCallRNModule.displayIncomingCall(callID, callerName, message, timeout ?? 60);
        zloginfo(`[NotificationHelper][showOnlineNotification] displayIncomingCall`)
        
        this._currentCallID = callID
        this._currentCallStatus = 'notification'
        zloginfo(`[NotificationHelper][showOnlineNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

        notifyTag = Date.now().toString()
        this._callIDUuidMap.set(callID, notifyTag)
        zloginfo(`[NotificationHelper][showOnlineNotification] set ${callID} into _callIDUuidMap`)

        PrebuiltCallReport.reportEvent('call/displayNotification', {
            'call_id': callID,
            'app_state': AppState.currentState
        })

        // callID mean zim callID
        this._callData = { callID, roomID, type, inviter, invitees }
        zloginfo(`[NotificationHelper][showOnlineNotification] _callData: ${JSON.stringify(this._callData)}`)
    }

    dismissNotification(callID: string, reason: string, from: string) {
        zloginfo(`[NotificationHelper][dismissNotification] callID: ${callID}, reason: ${reason}, from: ${from}`)

        if (reason === 'active') {
            // Handed over to the active state for handling
            let notifyUuid = this._callIDUuidMap.get(callID);
            if (notifyUuid) {
                ZegoUIKitPrebuiltCallRNModule.dismissCallNotification();
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
                ZegoUIKitPrebuiltCallRNModule.dismissCallNotification();
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

    _displayIncomingCall(callName: string, inviterName: string, type: number, inviteesCount: number) {
    }

    async _onCallKitEndCall(action: string) {
        if (!this._callData) {
            zlogerror('[NotificationHelper][_onCallKitEndCall] _callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][_onCallKitEndCall] callData: ${JSON.stringify(this._callData)}, state: ${AppState.currentState}`)
        
        // @ts-ignore
        let { callID, inviter, isPureOfflinePush } = this._callData;
        this._callData = undefined

        if (action === 'Timeout') {
            this._whenEndCallFinal()
        } else if (action !== 'Refuse') {
            // Currently, there are only two actions: Timeout and Refuse.
        } else if (isPureOfflinePush) {
            // click decline button from notification
            zloginfo('[NotificationHelper][_onCallKitEndCall] loadLoginInfoFromLocalEncryptedStorage')
            ZegoPrebuiltPlugin.loadLoginInfoFromLocalEncryptedStorage()
            .then((loginInfo: any) => {
                zloginfo(`[NotificationHelper][_onCallKitEndCall] will refuse after signalingPlugin login succ, callbackID: ${this._callbackID}`)
                ZegoPrebuiltPlugin.init(loginInfo.appID, loginInfo.appSign, loginInfo.userID, loginInfo.userName, this._plugins)
                .then(() => {
                    this._signalingPlugin.refuseInvitation(inviter.id, JSON.stringify({callID}))
                    .then((result: ZegoPluginResult) => {
                        zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation then, code: ${result.code}, message: ${result.message}`)
    
                        PrebuiltCallReport.reportEvent('call/respondInvitation', {
                            'call_id': callID,
                            'app_state': AppState.currentState,
                            'action': 'refuse'
                        })
                
                        CallInviteHelper.getInstance().refuseCall(callID);
                        this._whenEndCallFinal()
                        // In order to continue receiving offline push notifications in the future.
                        ZegoUIKit.getSignalingPlugin().uninit()
                    })
                    .catch((error: ZIMError) => {
                        zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation catch, error: ${error.code}, message: ${error.message}`)
    
                        CallInviteHelper.getInstance().refuseCall(callID);
                        this._whenEndCallFinal()
                        // In order to continue receiving offline push notifications in the future.
                        ZegoUIKit.getSignalingPlugin().uninit()
                    })
                })
                .catch(() => {
                    this._whenEndCallFinal()
                })
            }).catch(() => {
                this._whenEndCallFinal()
            })
        } else {
            this._signalingPlugin.refuseInvitation(inviter.id, JSON.stringify({callID}))
            .then((result: ZegoPluginResult) => {
                zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation then, code: ${result.code}, message: ${result.message}`)

                PrebuiltCallReport.reportEvent('call/respondInvitation', {
                    'call_id': callID,
                    'app_state': AppState.currentState,
                    'action': 'refuse'
                })
        
                CallInviteHelper.getInstance().refuseCall(callID);
                this._whenEndCallFinal()
            })
            .catch((error: ZIMError) => {
                zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation catch, error: ${error.code}, message: ${error.message}`)

                CallInviteHelper.getInstance().refuseCall(callID);
                this._whenEndCallFinal()
            })
        }
    }

    _whenEndCallFinal() {
        this._currentCallID = ''
        this._currentCallStatus = 'waiting'
        zloginfo(`[NotificationHelper][_onCallKitEndCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

        // auto dismiss
        // ZegoUIKitPrebuiltCallRNModule.dismissCallNotification();
    }

    _onCallKitAnswerCall() {
        if (!this._callData) {
            zlogerror('[NotificationHelper][_onCallKitAnswerCall] _callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][_onCallKitAnswerCall] callData: ${JSON.stringify(this._callData)}, state: ${AppState.currentState}`)

        // @ts-ignore
        let { callID, roomID, type, inviter, invitees, isPureOfflinePush } = this._callData;
        this._callData = undefined

        let app_state: string = (isPureOfflinePush) ? "restarted" : AppState.currentState

        if (isPureOfflinePush) {
            CallInviteHelper.getInstance().setOfflineData({call_id: roomID, type, inviter, invitees})
        } else {
            zloginfo(`[NotificationHelper][_onCallKitAnswerCall] will accept after signalingPlugin login succ, callbackID: ${this._callbackID}`)
            this._signalingPlugin.onLoginSuccess(this._callbackID, () => {
                CallInviteHelper.getInstance().acceptCall(callID, {call_id: roomID, type, inviter, invitees});
                ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id, JSON.stringify({callID}))
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
                })
                .catch((error: ZIMError) => {
                    zloginfo(`[NotificationHelper][_onCallKitAnswerCall] acceptInvitation catch, error: ${error.code}, message: ${error.message}`)
    
                    CallInviteHelper.getInstance().refuseCall(callID);
                    this._currentCallID = ''
                    this._currentCallStatus = 'waiting'
                    zloginfo(`[NotificationHelper][_onCallKitAnswerCall] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
                })    
            })
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