import ZegoUIKit, {
  ZegoInvitationConnectionState,
} from '@zegocloud/zego-uikit-rn';
import { zlogerror, zloginfo } from '../../utils/logger';
import EncryptedStorage from 'react-native-encrypted-storage';
import { eventEmitter, EventName } from '../../utils/EventEmitter';

const _appInfo = {};
const _localUser = {};
let _pluginConnectionState;
let ZIMKitPlugin = null;

const _install = (plugins) => {
  ZegoUIKit.installPlugins(plugins);
  plugins.forEach(plugin => {
    if (plugin.ZIMKit) {
      zloginfo('[Plugins] install ZIMKit success.');
      ZIMKitPlugin = plugin;
    } else if (plugin.default && typeof plugin.default.getModuleName === 'function') {
      const temp = plugin.default.getModuleName();
      if (temp === 'ZIMKit') {
        zloginfo('[Plugins] install ZIMKit success.');
        ZIMKitPlugin = plugin;
      }
    }
  })
};

const _storeLoginInfo = async () => {
  try {
    await EncryptedStorage.setItem(
      "_ZegoUIKitPrebuiltCallLoginInfo",
      JSON.stringify({
        userID: _localUser.userID,
        userName: _localUser.userName,
        appID: _appInfo.appID,
        appSign: _appInfo.appSign,
      })
    );
  } catch (error) {
    zlogerror('[Plugins] _storeLoginInfo error', error)
  }
}

const ZegoPrebuiltPlugins = {
  init: (appID, appSign, userID, userName, plugins) => {
    zloginfo('[ZegoPrebuiltPlugins] init', {
      appID,
      userID,
      userName,
    });

    const callbackID =
      'ZegoPrebuiltPlugins' + String(Math.floor(Math.random() * 10000));
    _install(plugins);
    ZegoUIKit.getSignalingPlugin().init(appID, appSign);
    ZegoUIKit.getSignalingPlugin().onConnectionStateChanged(
      callbackID,
      ({ state }) => {
        _pluginConnectionState = state;
      }
    );
    _appInfo.appID = appID;
    _appInfo.appSign = appSign;
    _localUser.userID = userID;
    _localUser.userName = userName;
    _storeLoginInfo();

    return ZegoUIKit.getSignalingPlugin()
      .login(userID, userName)
      .then(() => {
        zloginfo('[Plugins] login success.');
        eventEmitter.emit(EventName.LOGINED, { userID, userName });
      });
  },
  reconnectIfDisconnected: () => {
    zloginfo(
      '[Plugins] reconnectIfDisconnected',
      _pluginConnectionState,
      ZegoInvitationConnectionState.disconnected
    );
    if (_pluginConnectionState === ZegoInvitationConnectionState.disconnected) {
      ZegoUIKit.getSignalingPlugin().logout().then(() => {
        zloginfo('[Plugins] auto logout success.');
        ZegoUIKit.getSignalingPlugin().login(
          _localUser.userID,
          _localUser.userName
        ).then(() => {
          zloginfo('[Plugins] auto reconnect success.');
        });
      });
    }
  },
  uninit: () => {
    zloginfo('[ZegoPrebuiltPlugins] uninit');

    delete _appInfo.appID;
    delete _appInfo.appSign;
    delete _localUser.userID;
    delete _localUser.userName;
    ZegoUIKit.getSignalingPlugin().logout();
    ZegoUIKit.getSignalingPlugin().uninit();
  },
  getLocalUser: () => {
    return _localUser;
  },
  getAppInfo: () => {
    return _appInfo;
  },
  getZIMKitPlugin: () => {
    return ZIMKitPlugin;
  },
  loadLoginInfoFromLocalEncryptedStorage: async () => {
    try {
      const loginInfoStr = await EncryptedStorage.getItem(
        "_ZegoUIKitPrebuiltCallLoginInfo"
      );
      if (loginInfoStr) {
        return JSON.parse(loginInfoStr);
      }
    } catch (error) {
      zlogerror('[Plugins] getAppInfoFromLocalEncryptedStorage error', error)
      return Promise.resolve(undefined)
    }
  }
};

export default ZegoPrebuiltPlugins;
