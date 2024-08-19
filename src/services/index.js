import ZegoPrebuiltPlugins from "../call_invitation/services/plugins";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import CallInviteStateManage from '../call_invitation/services/invite_state_manager';
import BellManage from '../call_invitation/services/bell';
import InnerTextHelper from '../call_invitation/services/inner_text_helper';
import OfflineCallEventListener from '../call_invitation/services/offline_call_event_listener';
import { AppState } from 'react-native';
import { zloginfo } from '../utils/logger';
// import GetAppName from 'react-native-get-app-name';
import TimingHelper from "./timing_helper";
import MinimizingHelper from "../call/services/minimizing_helper";
import HangupHelper from "../call_invitation/services/hangup_helper";
import ZegoUIKitPrebuiltCallInvitation from "./invitation";
import RNCallKit from '../call_invitation/services/callkit'
import { ZegoCallEndReason } from "./defines";

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
        if (this.isInit) {
            this.notifyInit();
            Object.assign(this.config, config);
            return Promise.resolve();
        }
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

        // Enable offline notification
        ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(certificateIndex, isIOSSandboxEnvironment, this.config.appName);

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(() => {
              resolve();

              OfflineCallEventListener.getInstance().init(this.config);
  
              CallInviteStateManage.init();
              BellManage.initRingtoneConfig(ringtoneConfig);
              BellManage.initIncomingSound();
              BellManage.initOutgoingSound();
              this.isInit = true;
              this.notifyInit();
            }).catch(() => {
              reject();
            });
          }, 500);
        });
    }
    uninit() {
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
        const debounce = HangupHelper.getInstance().getDebounce();
        const config = this.config.requireConfig ? this.config.requireConfig({}) : {};
        const { onCallEnd, onHangUpConfirmation, hangUpConfirmInfo } = config;
        if (debounce) return;
        if (!showConfirmation) {
            const duration = TimingHelper.getInstance().getDuration();
            HangupHelper.getInstance().setDebounce(true);
            if (typeof onCallEnd == 'function') {
              onCallEnd('', ZegoCallEndReason.localHangUp, duration);
            } else {
              HangupHelper.getInstance().notifyAutoJump();
            }
            HangupHelper.getInstance().setDebounce(false);
        } else {
            HangupHelper.getInstance().setDebounce(true);
            const temp = onHangUpConfirmation || HangupHelper.getInstance().showLeaveAlert.bind(this, hangUpConfirmInfo);
            temp().then(() => {
                const duration = TimingHelper.getInstance().getDuration();
                if (typeof onCallEnd == 'function') {
                  onCallEnd('', ZegoCallEndReason.localHangUp, duration);
                } else {
                  HangupHelper.getInstance().notifyAutoJump();
                }
                HangupHelper.getInstance().setDebounce(false);
            });
        }
    }
    minimizeWindow () {
        MinimizingHelper.getInstance().minimizeWindow();
    }

    sendCallInvitation(invitees, isVideoCall, navigation, options) {
      return ZegoUIKitPrebuiltCallInvitation
        .getInstance()
        .sendCallInvitation(
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
}