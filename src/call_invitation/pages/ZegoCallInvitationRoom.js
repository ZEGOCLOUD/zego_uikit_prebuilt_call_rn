import React, { useEffect } from 'react';
import ZegoUIKitPrebuiltCall from '../../call';
import { ZegoInvitationType } from '../services/defines';
import BellManage from '../services/bell';
import CallInviteStateManage from '../services/inviteStateManager';
import { zloginfo } from '../../utils/logger';
import ZegoUIKit, {
  ZegoUIKitInvitationService,
} from '@zegocloud/zego-uikit-rn';

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
    callID,
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
      CallInviteStateManage.isAutoCancelInvite(callID)
    ) {
      ZegoUIKitInvitationService.cancelInvitation(invitees);
    }
    BellManage.stopOutgoingSound();
    navigation.navigate('HomePage');
  };

  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationRoom ' + String(Math.floor(Math.random() * 10000));
    if (invitees.length > 1) {
      BellManage.playOutgoingSound();
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
        zloginfo('Someone accepted the invitation');
        BellManage.stopOutgoingSound();
      });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('Invite completed with nobody');
        BellManage.stopOutgoingSound();
        navigation.navigate('HomePage');
      });
    }
    return () => {
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
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
