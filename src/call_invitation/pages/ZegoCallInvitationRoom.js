import React, { useEffect } from 'react';
import ZegoUIKitPrebuiltCall from '../../call';
import { ZegoInvitationType } from '../services/defines';
import BellManage from '../services/bell';
import CallInviteStateManage from '../services/inviteStateManager';
import { zloginfo } from '../../utils/logger';
import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export default function ZegoCallInvitationRoom(props) {
  const { route, navigation } = props;
  const {
    appID,
    appSign,
    userID,
    userName,
    roomID,
    isVideoCall,
    token,
    onRequireNewToken,
    requireConfig,
    invitees,
    inviter,
    invitationID,
  } = route.params;
  const callInvitationData = {
    type: isVideoCall
      ? ZegoInvitationType.videoCall
      : ZegoInvitationType.voiceCall,
    invitees,
  };
  const config = requireConfig(callInvitationData);

  const hangUpHandle = () => {
    // Determine if the current is Inviter
    if (
      inviter === userID &&
      CallInviteStateManage.isAutoCancelInvite(invitationID)
    ) {
      ZegoUIKit.getSignalingPlugin().cancelInvitation(invitees);
      CallInviteStateManage.updateInviteDataAfterCancel(invitationID);
    }
    BellManage.stopOutgoingSound();
    CallInviteStateManage.initInviteData();
    navigation.navigate('ZegoInnerChildrenPage');
  };

  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationRoom ' + String(Math.floor(Math.random() * 10000));
    ZegoUIKit.onOnlySelfInRoom(callbackID, () => {
      if (typeof config.onOnlySelfInRoom === 'function') {
        // Invite a single
        if (invitees.length === 1) {
          CallInviteStateManage.initInviteData();
          navigation.navigate('ZegoInnerChildrenPage');
        }
        config.onOnlySelfInRoom();
      }
    });
    if (invitees.length > 1 && inviter === userID) {
      BellManage.playOutgoingSound();
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
        zloginfo('Someone accepted the invitation');
        BellManage.stopOutgoingSound();
      });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('Invite completed with nobody');
        BellManage.stopOutgoingSound();
        CallInviteStateManage.initInviteData();
        navigation.navigate('ZegoInnerChildrenPage');
      });
    }
    return () => {
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      BellManage.stopOutgoingSound();
    };
  });

  return (
    <ZegoUIKitPrebuiltCall
      appID={appID}
      appSign={appSign}
      userID={userID}
      userName={userName}
      callID={roomID}
      config={{
        ...config,
        onHangUp: () => {
          hangUpHandle();
          config.onHangUp && config.onHangUp();
        },
      }}
      token={token}
      onRequireNewToken={onRequireNewToken}
    />
  );
}
