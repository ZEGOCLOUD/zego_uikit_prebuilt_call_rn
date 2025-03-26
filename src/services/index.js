import { AppState } from 'react-native';
// import GetAppName from 'react-native-get-app-name';
import ZegoUIKit, {ZegoUIKitLogger} from '@zegocloud/zego-uikit-rn';
import MinimizingHelper from "../call/services/minimizing_helper";
import PrebuiltHelper from '../call/services/prebuilt_helper';
import BellManage from '../call_invitation/services/bell';
import RNCallKit from '../call_invitation/services/callkit'
import HangupHelper from "../call_invitation/services/hangup_helper";
import InnerTextHelper from '../call_invitation/services/inner_text_helper';
import CallInviteStateManage from '../call_invitation/services/invite_state_manager';
import OfflineCallEventListener from '../call_invitation/services/offline_call_event_listener';
import ZegoPrebuiltPlugins from "../call_invitation/services/plugins";
import { zloginfo } from '../utils/logger';
import PrebuiltCallReport from '../utils/report';
import { getRnVersion } from '../utils/version';
import {getPackageVersion} from '../utils/package_version';
import { ZegoCallEndReason } from "./defines";
import ZegoUIKitPrebuiltCallInvitation from "./invitation";
import TimingHelper from "./timing_helper";

export default class ZegoUIKitPrebuiltCallService {
    _instance;
    appInfo = {};
    localUser = {};
    config = {
        ringtoneConfig: {
            incomingCallFileName: 'zego_incoming.mp3',
            outgoingCallFileName: 'zego_outgoing.mp3',
        },
        innerText: {},
        androidNotificationConfig: {
            channelID: "CallInvitation",
            channelName: "CallInvitation",
        },
        notifyWhenAppRunningInBackgroundOrQuit: false,
        isIOSSandboxEnvironment: null,
        waitingPageConfig: {
          // avatarBuilder
          // nameBuilder
          // stateBuilder
          // hangupBuilder
          // switchCameraBuilder,
          // backgroundColor,
          // foregroundBuilder,
        },
    };
    isInit = false;
    subscription = null;
    onInitCallbackMap = {};
    onRouteChangeCallbackMap = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new ZegoUIKitPrebuiltCallService());
    }
    getModuleName() {
        return 'PrebuiltCall';
    }
    useSystemCallingUI(plugins) {
        OfflineCallEventListener.getInstance().useSystemCallingUI(plugins);
    }
    init(appID, appSign, userID, userName, plugins, config = {}) {
        ZegoUIKitLogger.logSetUserID(userID)

        if (this.isInit) {
            this.notifyInit();
            Object.assign(this.config, config);
            return Promise.resolve();
        }

        zloginfo(`[ZegoUIKitPrebuiltCallService][init] appID: ${appID}, userID: ${userID}, userName: ${userName}`)

        // GetAppName.getAppName((appName) => {
            // zloginfo("[init]Here is your app name:", appName)    
            // this.config.appName = appName;
        // })
        this.appInfo = { appID, appSign };
        this.localUser = { userID, userName };
        Object.assign(this.config, config);

        // Call invitation
        const {
            ringtoneConfig,
            innerText,
            certificateIndex,
            isIOSSandboxEnvironment,
        } = this.config;
        // Init inner text helper
        InnerTextHelper.instance().init(innerText);
        // Monitor application status
        this.subscription = AppState.addEventListener(
            'change',
            (nextAppState) => {
                if (nextAppState === 'active') {
                  ZegoPrebuiltPlugins.reconnectIfDisconnected();
                }
            }
        );

        let zpnsPlugin = plugins.find(item => (item.ZPNsPushSourceType))
        if (zpnsPlugin) {
          // Enable offline notification
          ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(certificateIndex, isIOSSandboxEnvironment, this.config.appName);
        }

        PrebuiltCallReport.create(appID, appSign, {
          'platform': 'rn',
          'platform_version': getRnVersion(),
          'uikit_version': ZegoUIKit.getVersion(),
          'call_version': getPackageVersion(),
          'user_id': userID
        });
        
        const eventBegin = Date.now();
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(() => {
              PrebuiltCallReport.reportEvent('call/init', {
                'error': 0,
                'msg': '',
                'start_time': eventBegin
              });
              resolve();

              OfflineCallEventListener.getInstance().init(this.config);
  
              CallInviteStateManage.init();
              BellManage.initRingtoneConfig(ringtoneConfig);
              BellManage.initIncomingSound();
              BellManage.initOutgoingSound();
              this.isInit = true;
              this.notifyInit();
            }).catch(() => {
              PrebuiltCallReport.reportEvent('call/init', {
                'error': -1,
                'msg': 'unknown',
                'start_time': eventBegin
              });
              reject();
            });
          }, 500);
        });
    }
    uninit() {
        PrebuiltCallReport.reportEvent('call/unInit', null);
        if (this.isInit) {
            ZegoPrebuiltPlugins.uninit();
            BellManage.releaseIncomingSound();
            BellManage.releaseOutgoingSound();
            CallInviteStateManage.uninit();
            this.subscription.remove();
            OfflineCallEventListener.getInstance().uninit();
            this.isInit = false;
        }
    }
    getInitUser() {
        return this.localUser;
    }
    getInitAppInfo() {
        return this.appInfo;
    }
    getInitConfig() {
        return this.config;
    }
    notifyInit() {
        Object.keys(this.onInitCallbackMap).forEach((callbackID) => {
            if (this.onInitCallbackMap[callbackID]) {
                this.onInitCallbackMap[callbackID]();
            }
        });
    }
    onInit(callbackID, callback) {
        if (typeof callback !== 'function') {
            delete this.onInitCallbackMap[callbackID];
        } else {
            this.onInitCallbackMap[callbackID] = callback;
        }
    }
    hangUp(showConfirmation = false) {
        zloginfo(`[ZegoUIKitPrebuiltCallService][hangUp] showConfirmation: ${showConfirmation}`)

        const debounce = HangupHelper.getInstance().getDebounce();
        const config = this.config.requireConfig ? this.config.requireConfig({}) : {};
        const { onCallEnd, onHangUpConfirmation, hangUpConfirmInfo } = config;

        if (debounce) {
          zloginfo(`[ZegoUIKitPrebuiltCallService][hangUp] debounce: ${debounce}, return`)
          return;
        }
        
        let routeParams = PrebuiltHelper.getInstance().getRouteParams();
        if (!routeParams.roomID) {
          zloginfo(`[ZegoUIKitPrebuiltCallService][hangUp] can't get roomID from routeParams, return`)
          return
        }

        if (!showConfirmation) {
            HangupHelper.getInstance().setDebounce(true);
            this._hangupProcess(onCallEnd, routeParams.roomID, ZegoCallEndReason.localHangUp);
            HangupHelper.getInstance().setDebounce(false);
        } else {
            HangupHelper.getInstance().setDebounce(true);
            const temp = onHangUpConfirmation || HangupHelper.getInstance().showLeaveAlert.bind(this, hangUpConfirmInfo);
            temp().then(() => {
                this._hangupProcess(onCallEnd, routeParams.roomID, ZegoCallEndReason.localHangUp);
                HangupHelper.getInstance().setDebounce(false);
            });
        }
    }
    minimizeWindow () {
        MinimizingHelper.getInstance().minimizeWindow();
    }

    sendCallInvitation(invitees, isVideoCall, navigation, options) {
      return ZegoUIKitPrebuiltCallInvitation.getInstance().sendCallInvitation(
        invitees, 
        isVideoCall, 
        navigation, 
        options
      );
    }

    requestSystemAlertWindow(alert) {
      // System Alert
      RNCallKit.requestSystemAlertWindow(alert.message, alert.allow, alert.deny);
    }

    _hangupProcess(onCallEnd, roomID, endReason) {
      const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
      zloginfo('[ZegoUIKitPrebuiltCallService][_hangupProcess] roomID: ', roomID, 'endReason: ', endReason, 'isMinimize: ', isMinimize)
      const duration = TimingHelper.getInstance().getDuration();

      if (typeof onCallEnd !== 'function') {
        HangupHelper.getInstance().notifyAutoJump();
      } else {
        zloginfo('[ZegoUIKitPrebuiltCallService][hangUp] notify requireConfig.onCallEnd will')
        onCallEnd(roomID, endReason, duration);
        zloginfo('[ZegoUIKitPrebuiltCallService][hangUp] notify requireConfig.onCallEnd succeed')

        if (isMinimize) {
          PrebuiltHelper.getInstance().notifyDestroyPrebuilt();
        }
      }
    }
}