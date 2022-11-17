import ZegoPluginInvitationService from './services';
import {ZegoUIKitPluginType} from './defines';

export default class ZegoUIKitSignalingPlugin {
  static shared;
  _signaling = ZegoUIKitPluginType.signaling;
  constructor() {
    if (!ZegoUIKitSignalingPlugin.shared) {
      ZegoUIKitSignalingPlugin.shared = this;
    }
    return ZegoUIKitSignalingPlugin.shared;
  }
  static getInstance() {
    if (!ZegoUIKitSignalingPlugin.shared) {
      ZegoUIKitSignalingPlugin.shared = new ZegoUIKitSignalingPlugin();
    }
    return ZegoUIKitSignalingPlugin.shared;
  }
  static getVersion() {
    return ZegoPluginInvitationService.getInstance()
      .getVersion()
      .then(zimVersion => {
        return `signaling_plugin:1.0.0;zim:${zimVersion}`;
      });
  }
  getPluginType() {
    return this._signaling;
  }
  invoke(method, params) {
    switch (method) {
      case 'init':
        return ZegoPluginInvitationService.getInstance().init(
          params.appID,
          params.appSign,
        );
      case 'uninit':
        return ZegoPluginInvitationService.getInstance().uninit();
      case 'login':
        return ZegoPluginInvitationService.getInstance().login(
          params.userID,
          params.userName,
        );
      case 'logout':
        return ZegoPluginInvitationService.getInstance().logout();
      case 'sendInvitation':
        return ZegoPluginInvitationService.getInstance().sendInvitation(
          params.inviterName,
          params.invitees,
          params.timeout,
          params.type,
          params.data,
        );
      case 'cancelInvitation':
        return ZegoPluginInvitationService.getInstance().cancelInvitation(
          params.invitees,
          params.data,
        );
      case 'refuseInvitation':
        return ZegoPluginInvitationService.getInstance().refuseInvitation(
          params.inviterID,
          params.data,
        );
      case 'acceptInvitation':
        return ZegoPluginInvitationService.getInstance().acceptInvitation(
          params.inviterID,
          params.data,
        );
      default:
        break;
    }
  }
  registerPluginEventHandler(event, callbackID, callback) {
    switch (event) {
      case 'connectionStateChanged':
        ZegoPluginInvitationService.getInstance().onConnectionStateChanged(
          callbackID,
          callback,
        );
        break;
      case 'invitationReceived':
        ZegoPluginInvitationService.getInstance().onCallInvitationReceived(
          callbackID,
          callback,
        );
        break;
      case 'invitationTimeout':
        ZegoPluginInvitationService.getInstance().onCallInvitationTimeout(
          callbackID,
          callback,
        );
        break;
      case 'invitationResponseTimeout':
        ZegoPluginInvitationService.getInstance().onCallInviteesAnsweredTimeout(
          callbackID,
          callback,
        );
        break;
      case 'invitationAccepted':
        ZegoPluginInvitationService.getInstance().onCallInvitationAccepted(
          callbackID,
          callback,
        );
        break;
      case 'invitationRefused':
        ZegoPluginInvitationService.getInstance().onCallInvitationRejected(
          callbackID,
          callback,
        );
        break;
      case 'invitationCanceled':
        ZegoPluginInvitationService.getInstance().onCallInvitationCancelled(
          callbackID,
          callback,
        );
        break;
      default:
        break;
    }
  }
}
