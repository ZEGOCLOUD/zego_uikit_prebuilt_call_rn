import ZegoPrebuiltPlugins from "../call_invitation/services/plugins";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import CallInviteStateManage from '../call_invitation/services/inviteStateManager';
import BellManage from '../call_invitation/services/bell';
import InnerTextHelper from '../call_invitation/services/inner_text_helper';
import OffineCallEventListener from '../call_invitation/services/offline_call_event_listener';
import { AppState } from 'react-native';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { zloginfo } from '../utils/logger';

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
        isIOSSandboxEnvironment: true,
    };
    plugins = [];
    isInit = false;
    subscription = null;
    onInitCallbackMap = {};
    onRouteChangeCallbackMap = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new ZegoUIKitPrebuiltCallService());
    }
    isCallInvitation() {
        return Object.prototype.toString.call(this.plugins) === '[object Array]' && this.plugins.length;
    }
    init(appID, appSign, userID, userName, plugins, config = {}) {
        if (this.isInit) {
            return Promise.resolve();
        }
        this.appInfo = { appID, appSign };
        this.localUser = { userID, userName };
        Object.assign(this.config, config);
        this.plugins = plugins || [];
        if (this.isCallInvitation()) {
            // Call invitation

            const {
                ringtoneConfig,
                innerText,
                androidNotificationConfig,
                notifyWhenAppRunningInBackgroundOrQuit,
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
                  
                        notifee.cancelAllNotifications();
                    }
                }
            );
            // Notifee create
            notifee.cancelAllNotifications();
            notifee.createChannel({
                id: androidNotificationConfig.channelID,
                name: androidNotificationConfig.channelName,
                badge: false,
                vibration: false,
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: ringtoneConfig.incomingCallFileName.split('.')[0]
            });
            return ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(() => {
                // TODO trigger in timer is a workaround, it should be fix after upgrade ZIM to 2.6.0
                setTimeout(() => {
                    // Enable offline notification
                    ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(notifyWhenAppRunningInBackgroundOrQuit, isIOSSandboxEnvironment);
                    zloginfo("enableNotifyWhenAppRunningInBackgroundOrQuit: ", notifyWhenAppRunningInBackgroundOrQuit, isIOSSandboxEnvironment)
                }, 1000);

                OffineCallEventListener.getInstance().init(this.config);

                CallInviteStateManage.init();
                BellManage.initRingtoneConfig(ringtoneConfig);
                BellManage.initIncomingSound();
                BellManage.initOutgoingSound();
                this.isInit = true;
                this.notifyInit();
            });
        }
    }
    uninit() {
        if (this.isInit) {
            if (this.isCallInvitation()) {
                ZegoPrebuiltPlugins.uninit();
                BellManage.releaseIncomingSound();
                BellManage.releaseOutgoingSound();
                CallInviteStateManage.uninit();
                this.subscription.remove();
                OffineCallEventListener.getInstance().uninit();
            }
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
}