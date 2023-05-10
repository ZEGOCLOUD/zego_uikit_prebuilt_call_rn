import React, { useEffect } from 'react';
import ZegoUIKitPrebuiltCall from '../../call';
import { ZegoInvitationType } from '../services/defines';
import BellManage from '../services/bell';
import CallInviteStateManage from '../services/invite_state_manager';
import { zloginfo } from '../../utils/logger';
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import { useNavigation } from '@react-navigation/native';
import ZegoUIKitPrebuiltCallService from '../../services';
import {
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
} from '../../services/defines';
import CallInviteHelper from '../services/call_invite_helper';
import OfflineCallEventListener from '../services/offline_call_event_listener';

export default function ZegoUIKitPrebuiltCallInCallScreen(props) {
  const navigation = useNavigation();
  const { appID, appSign } = ZegoUIKitPrebuiltCallService.getInstance().getInitAppInfo();
  const { userID, userName } = ZegoUIKitPrebuiltCallService.getInstance().getInitUser();
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { token, onRequireNewToken, requireConfig } = initConfig;
  const { route } = props;
  const {
    origin,
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
  const requireDefaultConfig = (data) => {
    const callConfig =
      data.invitees.length > 1
        ? ZegoInvitationType.videoCall === data.type
          ? GROUP_VIDEO_CALL_CONFIG
          : GROUP_VOICE_CALL_CONFIG
        : ZegoInvitationType.videoCall === data.type
          ? ONE_ON_ONE_VIDEO_CALL_CONFIG
          : ONE_ON_ONE_VOICE_CALL_CONFIG;
    return {
      ...callConfig,
      onOnlySelfInRoom: () => {
        console.log('requireDefaultConfig onOnlySelfInRoom', data);
        if (data.invitees.length == 1) {
          navigation.goBack();
          origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && navigation.goBack();
        }
      },
    };
  };
  const config = typeof requireConfig === 'function' ? {
    ...requireDefaultConfig(callInvitationData),
    ...requireConfig(callInvitationData)
  } : requireDefaultConfig(callInvitationData);
  const callEndHandle = () => {
    const signalingPlugin = ZegoUIKit.getSignalingPlugin().getZegoUIKitSignalingPlugin();
    const currentCallUUID = CallInviteHelper.getInstance().getCurrentCallUUID();
    if (signalingPlugin && currentCallUUID) {
      signalingPlugin.getInstance().reportCallKitCallEnded(currentCallUUID);
    }
  };
  const hangUpHandle = () => {
    callEndHandle();
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
    console.log('ZegoUIKitPrebuiltCallInCallScreen init');
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
          origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
        }
      });
    }
    return () => {
      console.log('ZegoUIKitPrebuiltCallInCallScreen destroy');
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      BellManage.stopOutgoingSound();
      CallInviteStateManage.initInviteData();
    };
  }, []);

  return (
    <ZegoUIKitPrebuiltCall
      appID={appID}
      appSign={appSign}
      userID={userID}
      userName={userName}
      callID={roomID}
      config={{
        ...config,
        onHangUp: (duration) => {
          hangUpHandle();
          if (typeof config.onHangUp === 'function') {
            config.onHangUp(duration);
          } else {
            navigation.goBack();
            origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
          }
        },
        onOnlySelfInRoom: (duration) => {
          callEndHandle();
          console.log('requireDefaultConfig onOnlySelfInRoom', config.onOnlySelfInRoom, invitees);
          if (typeof config.onOnlySelfInRoom === 'function') {
            config.onOnlySelfInRoom(duration);
          } else {
            // Invite a single
            if (invitees.length === 1) {
              // navigation.navigate('ZegoInnerChildrenPage');
              if (typeof config.onHangUp === 'function') {
                config.onHangUp(duration);
              } else {
                navigation.goBack();
                origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
              }
            }
          }
        },
        onHangUpConfirmation: (typeof config.onHangUpConfirmation === 'function') ? () => {return config.onHangUpConfirmation()} : undefined,
      }}
      token={token}
      onRequireNewToken={onRequireNewToken}
    />
  );
}
