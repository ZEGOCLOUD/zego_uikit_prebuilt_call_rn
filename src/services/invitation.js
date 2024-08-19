import { ZegoInvitationType } from "../call_invitation/services/defines";
import ZegoPrebuiltPlugins from "../call_invitation/services/plugins";
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import CallInviteStateManage from "../call_invitation/services/invite_state_manager";
import InnerTextHelper from "../call_invitation/services/inner_text_helper";
import { zloginfo } from "../utils/logger";
import OfflineCallEventListener from "../call_invitation/services/offline_call_event_listener";


export default class ZegoUIKitPrebuiltCallInvitation {
  static _instance;
  constructor() { }
  static getInstance() {
    return this._instance || (this._instance = new ZegoUIKitPrebuiltCallInvitation());
  }

  sendCallInvitation(invitees, isVideoCall, navigation, options) {
    const {
      resourceID = '',
      timeout = 60,
      notificationTitle, 
      notificationMessage, 
      callID, 
      customData = '',
      callName,
      showWaitingPageWhenGroupCall = false,
    } = options;

    const localUser = ZegoPrebuiltPlugins.getLocalUser();
    const roomID = callID ?? `call_${localUser.userID}_${Date.now()}`;
    const data = JSON.stringify({
      call_id: roomID,
      call_name: callName,
      invitees: invitees.map(invitee => {
        return {user_id: invitee.userID, user_name: invitee.userName}
      }),
      type: isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
      inviter: {id: localUser.userID, name: localUser.userName},
      custom_data: customData,
    });
    const inviteeIDs = invitees.map(invitee => {
      return invitee.userID
    });
    const type = isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall

    // set notification config.
    const notificationConfig = {
      resourceID, 
      title: notificationTitle ?? InnerTextHelper.instance().getIncomingCallDialogTitle(
        localUser.userName,
        isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
        invitees.length), 
      message: notificationMessage ?? InnerTextHelper.instance().getIncomingCallDialogMessage(
        isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
        invitees.length
      )
    }

    return new Promise((resolve, reject) => {
      ZegoUIKit.getSignalingPlugin().sendInvitation(inviteeIDs, timeout, type, data, notificationConfig)
      .then(({ code, message, callID, errorInvitees }) => {
        zloginfo(
          `[CallInvitation]Send invitation success, code: ${code}, message: ${message}, errorInvitees: ${errorInvitees}`
          );
        if (inviteeIDs.length > errorInvitees.length) {
          const successfulInvitees = JSON.parse(JSON.stringify(inviteeIDs));
          errorInvitees.forEach((errorInviteeID) => {
            const index = successfulInvitees.findIndex(
              (inviteeID) => errorInviteeID === inviteeID
            );
            index !== -1 && successfulInvitees.splice(index, 1);
          });
          this.onInvitationSent(navigation, callID, invitees, successfulInvitees, roomID, isVideoCall, callName, showWaitingPageWhenGroupCall);
          resolve();
        } else {
          reject(-1, 'All invitees failed.');
        }
      })
      .catch(({ code, message }) => {
        reject(code, message);
      });
    });
  }

  onInvitationSent(navigation, callID, allInvitees, successfulInvitees, roomID, isVideoCall, callName, showWaitingPageWhenGroupCall) {
    zloginfo('[onInvitationSent]');

    const localUser = ZegoPrebuiltPlugins.getLocalUser();
    CallInviteStateManage.addInviteData(
      callID,
      localUser.userID,
      successfulInvitees
    );

    OfflineCallEventListener.getInstance().setCurrentRoomID(roomID);

    if (allInvitees.length === 1 || showWaitingPageWhenGroupCall) {
      // Jump to call waiting page
      zloginfo('Jump to call waiting page.');
      navigation.navigate('ZegoUIKitPrebuiltCallWaitingScreen', {
        roomID,
        isVideoCall,
        invitees: allInvitees,
        inviter: localUser.userID,
        invitationID: callID,
        callName,
      });
    } else {
      // Jump to call room page
      zloginfo('Jump to call room page.');
      const inviteeIDs = allInvitees.map(invitee => {
        return invitee.userID
      });
      navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen', {
        roomID,
        isVideoCall,
        invitees: inviteeIDs,
        inviter: localUser.userID,
        invitationID: callID,
      });
    }
  }
}