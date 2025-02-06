import { PermissionsAndroid, Platform } from 'react-native';

import ZegoUIKit from '@zegocloud/zego-uikit-rn';

import { zloginfo } from '../../utils/logger';
import { getPackageVersion } from '../../utils/package_version';
import InnerTextHelper from '../services/inner_text_helper';
import RNCallKit from './callkit';
import NotificationHelper from './notification_helper';

export default class OfflineCallEventListener {
    TAG = 'OfflineCallEventListener';

    _instance;
    callbackID = `${this.TAG}_${String(Math.floor(Math.random() * 10000))}`
    config = {};
    _currentCallData = {};
    _isSystemCalling = false;
    _isDisplayingCall = false;
    _currentRoomID = ''; // Use For callbacks.

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new OfflineCallEventListener());
    }

    useSystemCallingUI(plugins = []) {
        this._isSystemCalling = true;

        ZegoUIKit.installPlugins(plugins);
        ZegoUIKit.logComponentsVersion(new Map([['PrebuiltCall', getPackageVersion()]]));
        const signalingPlugin = ZegoUIKit.getSignalingPlugin().getZegoUIKitSignalingPlugin();

        // https://doc-zh.zego.im/article/17416
        signalingPlugin.getInstance().setBackgroundMessageHandler();

        signalingPlugin.getInstance().setAndroidOfflineDataHandler(async (data) => {
            zloginfo('OfflineDataHandler: ', data);

            NotificationHelper.getInstance().init(plugins)

            const cancelInvitation = data && data.operation_type === "cancel_invitation"
            if (!cancelInvitation) {
              NotificationHelper.getInstance().showOfflineNotification(data.zim_call_id, Date.now().toString(), data)
            } else {
              NotificationHelper.getInstance().dismissNotification(data.zim_call_id, 'BeCancelled', this.TAG)
            }
        })

        signalingPlugin.getInstance().setIOSOfflineDataHandler((data, callUUID) => {
            zloginfo("setIOSOfflineDataHandler", callUUID, data)

            ZegoUIKit.getSignalingPlugin().setAdvancedConfig('zim_voip_call_id', data.zim_call_id);

            NotificationHelper.getInstance().init()
            NotificationHelper.getInstance().showOfflineNotification(data.zim_call_id, callUUID, data)
        });
    }

    init(config) {
      zloginfo('######OfflineCallEventListener init', config);
      this.config = config;
      this.registerCallback();

      // Setup for background invitation
      if (!this._isSystemCalling) return;

      this.grantPermissions();

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
          zloginfo('requestMultiple', data);
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
      }
    }

    uninit() {
        zloginfo('######OfflineCallEventListener uninit');
        this.unregisterCallback();
    }
    
    registerCallback() {
        const TAG = 'offline_call_event_listener';
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
          // for caller
          zloginfo('onInvitationResponseTimeout implement by ' + TAG);

          if (typeof onOutgoingCallTimeout == 'function') {
              const roomID = this._currentRoomID === '' ? callID : this._currentRoomID;
              onOutgoingCallTimeout(roomID, invitees.map((invitee) => {
                  return { userID: invitee.id, userName: invitee.name }
              }))
          }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
          const roomID = this._currentRoomID === '' ? callID : this._currentRoomID;
          const jsonData = data ? JSON.parse(data) : undefined;
            if (jsonData && jsonData.reason == 'busy') {
                if (typeof onOutgoingCallRejectedCauseBusy == 'function') {
                    onOutgoingCallRejectedCauseBusy(roomID, { userID: invitee.id, userName: invitee.name })
                }
            } else {
                if (typeof onOutgoingCallDeclined == 'function') {
                    onOutgoingCallDeclined(roomID, { userID: invitee.id, userName: invitee.name })
                }
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ callID, invitee, data }) => {
            if (typeof onOutgoingCallAccepted == 'function') {
                const roomID = this._currentRoomID === '' ? callID : this._currentRoomID;
                onOutgoingCallAccepted(roomID, { userID: invitee.id, userName: invitee.name })
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, timeout, data }) => {
            zloginfo('onInvitationReceived implement by ' + TAG);

            const roomID = JSON.parse(data).call_id;
            const orgInvitees = JSON.parse(data).invitees;
            const invitees = orgInvitees.map((invitee) => {
                return { userID: invitee.user_id, userName: invitee.user_name }
            })
    
            // only for Android, ios will record at `setIOSOfflineDataHandler`
            /*if (Platform.OS === 'android') {
                this._currentCallData = {
                    ...JSON.parse(data),
                    type,
                    inviter,
                    callID,
                }
                zloginfo('The current call data: ', this._currentCallData);
            }*/

            // const invitees = this.getInviteesFromData(data)
            const custom_data = JSON.parse(data).custom_data;
            // Listen and show notification on background
            // this.showBackgroundNotification(callID, this._currentCallData.call_name, inviter.name, type, invitees)

            this._currentRoomID = roomID;
            if (typeof onIncomingCallReceived == 'function') {
                zloginfo('[onInvitationReceived] will call onIncomingCallReceived');
                onIncomingCallReceived(roomID, { userID: inviter.id, userName: inviter.name }, type, invitees, custom_data)
            }
        }, TAG);
        ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
            zloginfo(`onInvitationCanceled implement by ${TAG}, callID: ${callID}, inviter: ${JSON.stringify(inviter)}, data: ${JSON.stringify(data)}`);

            /*const callUUID = CallInviteHelper.getInstance().getCurrentCallUUID();
            zloginfo(`onInvitationCanceled, uuid: ${callUUID}`);
            // We need to close the callkit window
            if (AppState.currentState === "background" || Platform.OS === 'ios') {
                RemoteEnded = 2
                this._isDisplayingCall = false;
                this.reportEndCallWithUUID(callUUID, 2);
            }*/

            if (typeof onIncomingCallCanceled == 'function') {
              let dataParse = data ? JSON.parse(data) : undefined
              let roomID = dataParse ? dataParse.call_id : undefined
              onIncomingCallCanceled(roomID, { userID: inviter.id, userName: inviter.name })
            }
        });
        ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter, data }) => {
          // for callee
          zloginfo('onInvitationTimeout implement by ' + TAG);

          if (typeof onIncomingCallTimeout == 'function') {
              const roomID = this._currentRoomID === '' ? callID : this._currentRoomID;
              onIncomingCallTimeout(roomID, { userID: inviter.id, userName: inviter.name })
          }
        });
        zloginfo('registerCallback done');
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

    setCurrentRoomID(roomID) {
      this._currentRoomID = roomID;
    }
}