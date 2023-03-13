import React, { useEffect } from 'react';
import ZegoUIKitPrebuiltCall from '../../call';
import { ZegoInvitationType } from '../services/defines';
import BellManage from '../services/bell';
import CallInviteStateManage from '../services/inviteStateManager';
import { zloginfo } from '../../utils/logger';
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { useNavigation } from '@react-navigation/native';
import ZegoUIKitPrebuiltCallService from '../../services';

export default function ZegoUIKitPrebuiltCallInCallScreen(props) {
  const navigation = useNavigation();
  const { appID, appSign } = ZegoUIKitPrebuiltCallService.getInstance().getInitAppInfo();
  const { userID, userName } = ZegoUIKitPrebuiltCallService.getInstance().getInitUser();
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { token, onRequireNewToken, requireConfig } = initConfig;
  const { route } = props;
  const {
    roomID,
    isVideoCall,
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
    // navigation.navigate('ZegoInnerChildrenPage');
  };

  useEffect(() => {
    const callbackID =
      'ZegoUIKitPrebuiltCallInCallScreen ' + String(Math.floor(Math.random() * 10000));
    if (invitees.length > 1 && inviter === userID) {
      BellManage.playOutgoingSound();
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
        zloginfo('Someone accepted the invitation');
        BellManage.stopOutgoingSound();
      });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('Invite completed with nobody');
        // navigation.navigate('ZegoInnerChildrenPage');
        if (typeof config.onHangUp === 'function') {
          config.onHangUp();
        } else {
          navigation.goBack();
        }
      });
    }
    return () => {
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      BellManage.stopOutgoingSound();
      CallInviteStateManage.initInviteData();
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
          if (typeof config.onHangUp === 'function') {
            config.onHangUp();
          } else {
            navigation.goBack();
          }
        },
        onOnlySelfInRoom: () => {
          if (typeof config.onOnlySelfInRoom === 'function') {
            config.onOnlySelfInRoom();
          } else {
            // Invite a single
            if (invitees.length === 1) {
              // navigation.navigate('ZegoInnerChildrenPage');
              if (typeof config.onHangUp === 'function') {
                config.onHangUp();
              } else {
                navigation.goBack();
              }
            }
          }
        },
        onHangUpConfirmation: (typeof config.onHangUpConfirmation === 'function') ? () => {return config.onHangUpConfirmation()} : undefined
      }}
      token={token}
      onRequireNewToken={onRequireNewToken}
    />
  );
}
