import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { PermissionsAndroid, AppState, Platform } from 'react-native';
import InnerTextHelper from '../services/inner_text_helper';
import CallInviteHelper from './call_invite_helper';
import { zlogerror, zloginfo } from '../../utils/logger';
import ZegoPrebuiltPlugin from './plugins'
import { setCategory } from 'react-native-sound';
import ZegoUIKitPrebuiltCallService from '../../services';
import RNCallKit from './callkit';

export default class OfflineCallEventListener {
    _instance;
    callbackID = 'OfflineCallEventListener ' + String(Math.floor(Math.random() * 10000));
    config = {};
    _currentCallData = {};
    _isSystemCalling = false;
    _callEndByAnswer = false;
    _isDisplayingCall = false;
    _currentCallID = ''; // For Android.

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new OfflineCallEventListener());
    }

    useSystemCallingUI(plugins = []) {
        this._isSystemCalling = true;

        ZegoUIKit.installPlugins(plugins);
        const signalingPlugin = ZegoUIKit.getSignalingPlugin().getZegoUIKitSignalingPlugin();

        signalingPlugin.getInstance().setBackgroundMessageHandler();

        signalingPlugin.getInstance().setAndroidOfflineDataHandler(async (data) => {
            console.log('OfflineDataHandler: ', data);

            const cancelInvitation = data && data.operation_type === "cancel_invitation"

            // receive invitation first and then receive cancel.
            if (this._currentCallID == data.zim_call_id && !cancelInvitation) {
              console.log('OfflineDataHandler: busy, callID: ', data.zim_call_id);
              return;
            }

            if (this._isDisplayingCall && !cancelInvitation) {
                // reject call.
                console.log('OfflineDataHandler: busy, reject call invitation.');
                this.refuseOfflineInvitation(plugins, data.inviter.id, data.zim_call_id);
                return;
            }

            if (cancelInvitation) {
              RNCallKit.endCall();
              this._isDisplayingCall = false;
              this._currentCallID = data.zim_call_id;
            } else {
              RNCallKit.removeEventListener('answerCall');
              RNCallKit.removeEventListener('endCall');

              this._isDisplayingCall = true;
              RNCallKit.addEventListener('answerCall', () => {
                  this._callEndByAnswer = true;
                  this._isDisplayingCall = false;

                  // When the app launch, ZIM will send the online invite again
                  // Then we can read the offline data to decide if need to join the room directly
                  CallInviteHelper.getInstance().setOfflineData(data);

                  RNCallKit.endCall();
              });
              RNCallKit.addEventListener('endCall', async () => {
                  this._isDisplayingCall = false;

                  // Do your normal `Hang Up` actions here
                  if (!this._callEndByAnswer) {
                      this.refuseOfflineInvitation(plugins, data.inviter.id, data.zim_call_id);
                  }
              });
              const invitees = data.invitees;
              this.displayIncomingCall(data.zim_call_id, data.inviter.name, data.type, invitees.length);
            }
        })

        signalingPlugin.getInstance().setIOSOfflineDataHandler((data, callUUID) => {
            CallInviteHelper.getInstance().setOfflineData(undefined)
            zloginfo("setIOSOfflineDataHandler", callUUID, data)
            
            ZegoUIKit.getSignalingPlugin().setAdvancedConfig('zim_voip_call_id', data.zim_call_id);

            if (this._isDisplayingCall)  {
                zloginfo('setIOSOfflineDataHandler: busy, reject call invitation.');
                ZegoUIKit.getSignalingPlugin().refuseInvitation(data.inviter.id, JSON.stringify({callID: data.zim_call_id}));
                this.reportEndCallWithUUID(callUUID, 2);
                return;
            }

            this._isDisplayingCall = true;
            CallInviteHelper.getInstance().setCurrentCallUUID(callUUID);

            this._currentCallData = data

            // This cannot be written in the answer call, dialog cannot get
            signalingPlugin.getInstance().onCallKitAnswerCall((action) => {
                zloginfo("onCallKitAnswerCall", data)

                this._callEndByAnswer = true;
                this._isDisplayingCall = false;

                // The report succeeds regardless of the direct service scenario
                action.fulfill();
                // if (AppState.currentState !== 'background') {
                //     signalingPlugin.getInstance().reportCallKitCallEnded(callUUID);
                // }
                CallInviteHelper.getInstance().setOfflineData(data);

                // need setCategory
                setCategory('PlayAndRecord');

                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                if (data && data.inviter) {
                    // If you kill the application, you do not need to process it, and this value is also empty
                    if (this._currentCallData && this._currentCallData.zim_call_id) {
                        this._currentCallData = {}
                        CallInviteHelper.getInstance().acceptCall(data.zim_call_id, data);
                        ZegoUIKit.getSignalingPlugin().acceptInvitation(data.inviter.id, undefined)
                    }
                }
            });
            signalingPlugin.getInstance().onCallKitEndCall((action) => {
                this._isDisplayingCall = false;
                console.log('######onCallKitEndCall', callUUID);
                // TODO it should be invitataionID but not callUUID, wait for ZPNs's solution
                if (data && data.inviter) {
                    if (this._currentCallData && this._currentCallData.zim_call_id) {
                        this._currentCallData = {}
                        this.refuseOfflineInvitation(plugins, data.inviter.id, data.zim_call_id);
                        CallInviteHelper.getInstance().refuseCall(data.zim_call_id);
                    } else {
                        console.log('######ZegoUIKitPrebuiltCallService.hangUp');
                        ZegoUIKitPrebuiltCallService.getInstance().hangUp();
                    }
                }
                // The report succeeds regardless of the direct service scenario
                action.fulfill();
            })
        });

        AppState.addEventListener('change', async nextState => {
            console.log('nextState', nextState);
            if (nextState === 'active') {
                if (Platform.OS === 'ios') {
                  this.reportEndCallWithUUID(CallInviteHelper.getInstance().getCurrentCallUUID(), 2);
                  this._isDisplayingCall = false;
                } else {
                  RNCallKit.endCall();
                }
            }
        });
    }
    init(config) {
      console.log('######OfflineCallEventListener init', config);
      this.config = config;
      this.registerCallback();

      this.grantPermissions();

      // Setup for background invitation
      if (!this._isSystemCalling) return;

      this.setupOnlineCallKit();
    }
    async grantPermissions() {
      if (Platform.OS !== 'android') {
        return;
      }
      if (RNCallKit.getApiLevelSync() < 33) {
        return;
      }

      // Notification
      let grantednNtification = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      const ungrantedPermissions = [];
      try {
        const isNotificationGranted = await grantednNtification;
        if (!isNotificationGranted) {
          ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
      } catch {
        ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
        data => {
          console.info('requestMultiple', data);
        },
      );
    }
    // For Android
    setupOnlineCallKit() {

      const {
        ringtoneConfig,
      } = this.config;

      if (!ringtoneConfig) {
        zloginfo('ringtoneConfig is required for calling notification');
      }

      if (Platform.OS === 'android') {

        if (ringtoneConfig && ringtoneConfig.incomingCallFileName) {
          RNCallKit.setupCallKit({
            incomingCallFileName: ringtoneConfig.incomingCallFileName,
            incomingDeclineButtonText: InnerTextHelper.instance().getInnerText().incomingCallPageDeclineButton,
            incomingAcceptButtonText: InnerTextHelper.instance().getInnerText().incomingCallPageAcceptButton,
          });
        }

        RNCallKit.removeEventListener('answerCall')
        RNCallKit.removeEventListener('endCall')
  
        RNCallKit.addEventListener('answerCall', () => {
            this._callEndByAnswer = true;
  
            console.log('Answer call on background mode: ', this._currentCallData)
            
            CallInviteHelper.getInstance().acceptCall(this._currentCallData.callID, this._currentCallData);
            ZegoUIKit.getSignalingPlugin().acceptInvitation(this._currentCallData.inviter.id, undefined)
  
            RNCallKit.endCall();
        });
        RNCallKit.addEventListener('endCall', () => {
            if (!this._callEndByAnswer) {
                CallInviteHelper.getInstance().refuseCall(this._currentCallData.callID);
                ZegoUIKit.getSignalingPlugin().refuseInvitation(this._currentCallData.inviter.id, undefined)
            }
            this._callEndByAnswer = false;
        }); 
      }
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
            // only for Android, ios will record at `setIOSOfflineDataHandler`
            if (Platform.OS === 'android') {
                this._currentCallData = {
                    ...JSON.parse(data),
                    type,
                    inviter,
                    callID,
                }
                console.log('The current call data: ', this._currentCallData);
            }

            const invitees = this.getInviteesFromData(data)
            const custom_data = JSON.parse(data).custom_data;
            // Listen and show notification on background
            this.showBackgroundNotification(callID, inviter.name, type, invitees)
            if (typeof onIncomingCallReceived == 'function') {
                onIncomingCallReceived(callID, { userID: inviter.id, userName: inviter.name }, type, invitees, custom_data)
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
            if (Platform.OS === 'android') {
                RNCallKit.endCall();
            }
            
            const callUUID = CallInviteHelper.getInstance().getCurrentCallUUID();
            console.log(`onInvitationCanceled, uuid: ${callUUID}`);
            // We need to close the callkit window
            if (AppState.currentState === "background" || Platform.OS === 'ios') {
                // RemoteEnded = 2
                this._isDisplayingCall = false;
                this.reportEndCallWithUUID(callUUID, 2);
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
    getInviteesFromData(data) {
        const invitees = JSON.parse(data).invitees;
        return invitees.map((invitee) => {
            return { userID: invitee.user_id, userName: invitee.user_name };
        });
    }
    showBackgroundNotification(callID, inviterName, type, invitees) {
        if (AppState.currentState !== "background" || Platform.OS === 'ios') {
            return;
        }
        if (this._isSystemCalling) {
          this.displayIncomingCall(callID, inviterName, type, invitees.length);
        }
    }

    displayIncomingCall(callID, inviterName, type, inviteesCount) {
        if (this._currentCallID === callID) {
          console.log(`DisplayIncomingCall busy, callID: ${callID}`);
          return;
        }
        this._currentCallID = callID;
        console.log(`DisplayIncomingCall, callID: ${callID}, inviterName: ${inviterName}, type: ${type}`);
        
        const title = InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, inviteesCount);
        const message = InnerTextHelper.instance().getIncomingCallDialogMessage(type, inviteesCount);
        RNCallKit.displayIncomingCall(title, message);
    }
    
    reportEndCallWithUUID(callUUID, reason) {
        if (!callUUID) {
            return
        }
        ZegoUIKit.getSignalingPlugin().reportZPNsCallKitCallEnded(callUUID, reason);
    }

    // This is for Android Only
    async refuseOfflineInvitation(plugins, inviterID, callID) {
        // Init ZIM for reject invitation
        const loginInfo = await ZegoPrebuiltPlugin.loadLoginInfoFromLocalEncryptedStorage()
        
        if (loginInfo) {
          await ZegoPrebuiltPlugin.init(loginInfo.appID, loginInfo.appSign, loginInfo.userID, loginInfo.userName, plugins)
          
          ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(this.config.certificateIndex);
          zloginfo('[setAndroidOfflineDataHandler] login zim success.', loginInfo.userID, loginInfo.userName);
        }

        // Refuse incomming call
        ZegoUIKit.getSignalingPlugin().refuseInvitation(
            inviterID, 
            JSON.stringify({callID: callID})
          ).then(() => {
            console.log('[setAndroidOfflineDataHandler] refuse invitation success')
            if (Platform.OS === 'android') {
              ZegoUIKit.getSignalingPlugin().uninit()

              this._callEndByAnswer = false;
            }
        })
        .catch(() => {
            console.log('[setAndroidOfflineDataHandler] refuse invitation failed.')
            if (Platform.OS === 'android') {
              ZegoUIKit.getSignalingPlugin().uninit()
              this._callEndByAnswer = false;
            }
        });
    }
}