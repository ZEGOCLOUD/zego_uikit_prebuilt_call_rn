import React from 'react';
import ZegoUIKitPrebuiltCall from '../../call';
import { ZegoInvitationType } from '../../call_invitation/services/defines';

export default function ZegoCallInvitationRoom(props) {
  const { route } = props;
  const {
    appID,
    appSign,
    userID,
    userName,
    callID,
    isVideoCall,
    token,
    onRequireNewToken,
    requireConfig,
    invitees,
    inviter,
  } = route.params;
  const callInvitationData = {
    roomID: callID,
    type: isVideoCall
      ? ZegoInvitationType.videoCall
      : ZegoInvitationType.voiceCall,
    invitees,
    inviter,
  };
  const config = requireConfig(callInvitationData);
  return (
    <ZegoUIKitPrebuiltCall
      appID={appID}
      appSign={appSign}
      userID={userID}
      userName={userName}
      callID={callID}
      config={config}
      token={token}
      onRequireNewToken={onRequireNewToken}
    />
  );
}
