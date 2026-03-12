import { NativeModules, Platform } from 'react-native';

import ZegoUIKit, { ZegoUIKitLogger } from '@zegocloud/zego-uikit-rn';

import { zloginfo } from '../../utils/logger';
import { getPackageVersion } from '../../utils/package_version';
import InnerTextHelper from '../services/inner_text_helper';
import NotificationHelper from './notification_helper';

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;

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

        ZegoUIKitLogger.logFlush()
    }

    init(config) {
      zloginfo('######OfflineCallEventListener init', config);
      this.config = config;

      // Setup for background invitation
      if (!this._isSystemCalling) return;

      this.setupOnlineCallKit();
    }

    // For Android
    setupOnlineCallKit() {
      const {
        ringtoneConfig,
      } = this.config;

      if (!ringtoneConfig) {
        zloginfo('ringtoneConfig is required for calling notification');
      }

      if (Platform.OS === 'android' && ringtoneConfig && ringtoneConfig.incomingCallFileName) {
        zloginfo('call ZegoUIKitPrebuiltCallRNModule.setupCallKit');
        ZegoUIKitPrebuiltCallRNModule.setupCallKit({
          incomingCallFileName: ringtoneConfig.incomingCallFileName,
          incomingDeclineButtonText: InnerTextHelper.instance().getInnerText().incomingCallPageDeclineButton,
          incomingAcceptButtonText: InnerTextHelper.instance().getInnerText().incomingCallPageAcceptButton,
        });
      }
    }

    uninit() {
        zloginfo('######OfflineCallEventListener uninit');
    }
}