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
import TimingHelper from '../../services/timing_helper';
import PrebuiltHelper from "../../call/services/prebuilt_helper";
import MinimizingHelper from "../../call/services/minimizing_helper";
import HangupHelper from '../services/hangup_helper';

export default function ZegoUIKitPrebuiltCallInCallScreen(props) {
  const navigation = useNavigation();
  const { appID, appSign } = ZegoUIKitPrebuiltCallService.getInstance().getInitAppInfo();
  const { userID, userName } = ZegoUIKitPrebuiltCallService.getInstance().getInitUser();
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { token, onRequireNewToken, requireConfig } = initConfig;
  const { route } = props;
  const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
  let routeParams = PrebuiltHelper.getInstance().getRouteParams();
  if (!isMinimizeSwitch) {
    routeParams.origin = route.params.origin;
    routeParams.roomID = route.params.roomID;
    routeParams.isVideoCall = route.params.isVideoCall;
    routeParams.invitees = route.params.invitees;
    routeParams.inviter = route.params.inviter;
    routeParams.invitationID = route.params.invitationID;
  }
  console.log('#####ZegoUIKitPrebuiltCallInCallScreen#######', routeParams, route.params);
  const {
    origin,
    roomID,
    isVideoCall,
    invitees,
    inviter,
    invitationID,
  } = routeParams;
  const callInvitationData = {
    type: isVideoCall
      ? ZegoInvitationType.videoCall
      : ZegoInvitationType.voiceCall,
    invitees,
    callID: roomID,
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
        zloginfo('requireDefaultConfig onOnlySelfInRoom', data);
        const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
        if (data.invitees.length == 1) {
          if (isMinimize) {
            PrebuiltHelper.getInstance().notifyDestroyPrebuilt();
          } else {
            if (typeof config.onHangUp === 'function') {
              config.onHangUp(TimingHelper.getInstance().getDuration());
            } else {
              navigation.goBack();
              origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && navigation.goBack();
            }
          }
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
      signalingPlugin.getInstance().reportCallKitCallEnded(currentCallUUID, 2);
    }
  };
  const hangUpHandle = () => {
    callEndHandle();
    // Determine if the current is Inviter
    if (
      inviter === userID &&
      CallInviteStateManage.isAutoCancelInvite(invitationID)
    ) {
      ZegoUIKit.getSignalingPlugin().cancelInvitation(invitees, JSON.stringify({"call_id": roomID, "operation_type": "cancel_invitation"}));
      CallInviteStateManage.updateInviteDataAfterCancel(invitationID);
    }
    // navigation.navigate('ZegoInnerChildrenPage');
  };

  useEffect(() => {
    zloginfo('ZegoUIKitPrebuiltCallInCallScreen init');
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
    HangupHelper.getInstance().onAutoJump(callbackID, () => {
      zloginfo('########onAutoJump#########', origin, invitees.length);
      hangUpHandle();

      navigation.goBack();
      origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
    });
    return () => {
      zloginfo('ZegoUIKitPrebuiltCallInCallScreen destroy');
      HangupHelper.getInstance().onAutoJump(callbackID);
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
          zloginfo('requireDefaultConfig onOnlySelfInRoom', config.onOnlySelfInRoom, invitees);
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
