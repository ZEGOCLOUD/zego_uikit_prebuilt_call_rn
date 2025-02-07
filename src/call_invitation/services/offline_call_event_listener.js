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
    config = {};
    _isSystemCalling = false;

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

      // Setup for background invitation
      if (!this._isSystemCalling) return;

      this.grantPermissions();

      this.setupOnlineCallKit();
    }

    async grantPermissions() {
      if (Platform.OS !== 'android') {
        return;
      }

      // for android
      if (Platform.Version < 33) {
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
    }
}