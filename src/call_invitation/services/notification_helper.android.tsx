import { AppState, NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

import ZegoUIKit, { ZegoPluginResult } from '@zegocloud/zego-uikit-rn';
import { ZIMError } from 'zego-zim-react-native';

import { zlogerror, zloginfo, zlogwarning } from '../../utils/logger';
import PrebuiltCallReport from '../../utils/report';
import CallInviteHelper from './call_invite_helper';
import InnerTextHelper from './inner_text_helper';
import ZegoPrebuiltPlugins from './plugins';

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
            this._offlineRefuse(callID, roomID, inviter, 'busy')
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

        this._displayIncomingCall(callID, callerName, message, timeout ?? 60, 'restarted')
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

        this._displayIncomingCall(callID, callerName, message, timeout ?? 60, AppState.currentState)
        
        this._currentCallID = callID
        this._currentCallStatus = 'notification'
        zloginfo(`[NotificationHelper][showOnlineNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)

        notifyTag = Date.now().toString()
        this._callIDUuidMap.set(callID, notifyTag)
        zloginfo(`[NotificationHelper][showOnlineNotification] set ${callID} into _callIDUuidMap`)

        // callID mean zim callID
        this._callData = { callID, roomID, type, inviter, invitees }
        zloginfo(`[NotificationHelper][showOnlineNotification] _callData: ${JSON.stringify(this._callData)}`)
    }

    _displayIncomingCall(callID: string, callerName: string, message: string, timeout: number, appState: string) {
        if (Platform.Version as number < 33) {  // below Android 13
            if (ZegoUIKitPrebuiltCallRNModule.areNotificationsEnabled()) {
                this._displayIncomingCallInternal(callID, callerName, message, timeout, appState)                
            } else {
                zlogwarning(`[NotificationHelper][_displayIncomingCall] displayIncomingCall failed, no permission`)
            }
        } else {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
            .then((hasPermission) => {
                if (hasPermission) {
                    this._displayIncomingCallInternal(callID, callerName, message, timeout, appState)
                } else {
                    zlogwarning(`[NotificationHelper][_displayIncomingCall] displayIncomingCall failed, no permission`)
                }
            })
        }
    }

    _displayIncomingCallInternal(callID: string, callerName: string, message: string, timeout: number, appState: string) {
        ZegoUIKitPrebuiltCallRNModule.displayIncomingCall(callID, callerName, message, timeout);
        zloginfo(`[NotificationHelper][_displayIncomingCall] displayIncomingCall callID: ${callID}, state: ${appState}`)
        PrebuiltCallReport.reportEvent('call/displayNotification', {
            'call_id': callID,
            'app_state': appState
        })
    }

    dismissNotification(callID: string, reason: string, from: string) {
        zloginfo(`[NotificationHelper][dismissNotification] callID: ${callID}, reason: ${reason}, from: ${from}`)

        if (reason === 'BeCancelled' || reason === 'Timeout') {
            if (!callID || callID !== this._currentCallID) {
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
        } else {
            // Handed over to the active state for handling
            let notifyUuid = this._callIDUuidMap.get(callID);
            if (notifyUuid) {
                ZegoUIKitPrebuiltCallRNModule.dismissCallNotification();
                this._currentCallID = ''
                this._currentCallStatus = 'waiting'
                zloginfo(`[NotificationHelper][dismissNotification] set _currentCallID: ${this._currentCallID}, status: ${this._currentCallStatus}`)
            }
        }
    }

    async _onCallKitEndCall(action: string) {
        if (!this._callData) {
            zlogerror('[NotificationHelper][_onCallKitEndCall] _callData is empty')
            return
        }
        zloginfo(`[NotificationHelper][_onCallKitEndCall] callData: ${JSON.stringify(this._callData)}, state: ${AppState.currentState}`)
        
        // Offline incoming calls are not supported (too early), and online incoming calls rely on ZegoCallInvitationDialog
        // CallEventNotifyApp.getInstance().notifyIncomingCallDeclineButtonPressed()
        
        // @ts-ignore
        let { callID, roomID, inviter, isPureOfflinePush } = this._callData;
        this._callData = undefined

        if (action === 'Timeout') {
            this._whenEndCallFinal()
        } else if (action !== 'Refuse') {
            // Currently, there are only two actions: Timeout and Refuse.
        } else if (isPureOfflinePush) {
            // click decline button from notification
            this._offlineRefuse(callID, roomID, inviter, 'refuse')
        } else {
            // click decline button from notification
            this._onlineRefuse(callID, roomID, inviter)
        }
    }

    _offlineRefuse(callID: string, roomID: string, inviter: any, reason: string) {
        zloginfo('[NotificationHelper][_onCallKitEndCall] loadLoginInfoFromLocalEncryptedStorage')
        ZegoPrebuiltPlugins.loadLoginInfoFromLocalEncryptedStorage()
        .then((loginInfo: any) => {
            zloginfo(`[NotificationHelper][_onCallKitEndCall] will refuse after signalingPlugin login succ, callbackID: ${this._callbackID}`)
            ZegoPrebuiltPlugins.init(loginInfo.appID, loginInfo.appSign, loginInfo.userID, loginInfo.userName, this._plugins)
            .then(() => {
                this._signalingPlugin.refuseInvitation(inviter.id, JSON.stringify({
                    callID, 
                    call_id: roomID, 
                    reason,
                    'invitee': {userID: loginInfo.userID, userName: loginInfo.userName}
                }))
                .then((result: ZegoPluginResult) => {
                    zloginfo(`[NotificationHelper][_onCallKitEndCall] refuseInvitation then, code: ${result.code}, message: ${result.message}`)

                    PrebuiltCallReport.reportEvent('call/respondInvitation', {
                        'call_id': callID,
                        'app_state': 'restarted',
                        'action': reason
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
    }

    _onlineRefuse(callID: string, roomID: string, inviter: any) {
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