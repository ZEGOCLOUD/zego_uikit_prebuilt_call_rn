import ZegoUIKit, {
  ZegoUIKitPluginType,
  ZegoUIKitInvitationService,
} from '@zegocloud/zego-uikit-rn';
import { zloginfo } from '../../utils/logger';

const _appInfo = {};
const _localUser = {};
const _install = (plugins) => {
  ZegoUIKit.installPlugins(plugins);
  Object.values(ZegoUIKitPluginType).forEach((pluginType) => {
    // TODO
    // const pluginVersion = ZegoUIKit.getPlugin(pluginType).getVersion();
    zloginfo(
      `[Plugins] install success, pluginType: ${pluginType}, version: ${1.0}`
    );
  });
};

const ZegoPrebuiltPlugins = {
  init: (appID, appSign, userID, userName, plugins) => {
    _install(plugins);
    ZegoUIKitInvitationService.init(appID, appSign);
    _appInfo.appID = appID;
    _appInfo.appSign = appSign;
    return ZegoUIKitInvitationService.login(userID, userName).then(() => {
      _localUser.userID = userID;
      _localUser.userName = userName;
    });
  },
  uninit: () => {
    ZegoUIKitInvitationService.uninit();
    return ZegoUIKitInvitationService.logout();
  },
  getLocalUser: () => {
    return _localUser;
  },
  getAppInfo: () => {
    return _appInfo;
  },
};

export default ZegoPrebuiltPlugins;
