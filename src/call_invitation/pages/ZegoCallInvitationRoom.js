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
  ZegoCallEndReason,
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
  const { requireConfig, avatarBuilder, requireInviterConfig } = initConfig;
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
  zloginfo('#####ZegoUIKitPrebuiltCallInCallScreen#######', routeParams, route.params);
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
    };
  };
  const config = typeof requireConfig === 'function' ? {
    ...requireDefaultConfig(callInvitationData),
    ...requireConfig(callInvitationData),
    requireInviterConfig
  } : requireDefaultConfig(callInvitationData);

  const _onCallEnd = (callID, reason, duration) => {
    zloginfo('[ZegoUIKitPrebuiltCallInCallScreen] onCallEnd', callID, reason, duration);
    if (reason === ZegoCallEndReason.localHangUp) {
      hangUpHandle();
    } else {
      callEndHandle();
    }

    // callback.
    if (typeof config.onCallEnd == 'function') {
      config.onCallEnd(callID, reason, duration);
    } else {
      const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
      if (isMinimize) {
        PrebuiltHelper.getInstance().notifyDestroyPrebuilt();
      } else {
        navigation.goBack();
        origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && navigation.goBack();
      }
    }
    
    clearAutoHangUpTimer();
  };

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

  let hangUpTimer = null;
  const startAutoHangUpTimer = (detectSeconds) => {
    if (hangUpTimer) {
      clearTimeout(hangUpTimer);
    }

    zloginfo(`[ZegoUIKitPrebuiltCallInCallScreen] startAutoHangUpTimer, will auto hangup after ${detectSeconds} seconds if inviter does not join this call.`);
    const newTimer = setTimeout(() => {
      zloginfo('[ZegoUIKitPrebuiltCallInCallScreen] autoHangUp');
      const duration = TimingHelper.getInstance().getDuration();
      _onCallEnd(roomID, ZegoCallEndReason.localHangUp, duration);
    }, detectSeconds * 1000);

    hangUpTimer = newTimer;
  };

  const clearAutoHangUpTimer = () => {
    if (hangUpTimer) {
      zloginfo('[ZegoUIKitPrebuiltCallInCallScreen] clearAutoHangUpTimer');
      clearTimeout(hangUpTimer);
      hangUpTimer = null;
    }
  };

  useEffect(() => {
    zloginfo('ZegoUIKitPrebuiltCallInCallScreen init');
    const callbackID =
      'ZegoUIKitPrebuiltCallInCallScreen ' + String(Math.floor(Math.random() * 10000));
    
    // if group call from `ZegoUIKitPrebuiltCallWaitingScreen`, don't need add this anymore.
    if (invitees.length > 1 && inviter === userID && origin != 'ZegoUIKitPrebuiltCallWaitingScreen') {
      BellManage.playOutgoingSound();
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
        zloginfo('Someone accepted the invitation');
        BellManage.stopOutgoingSound();
      });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('Invite completed with nobody');
        // navigation.navigate('ZegoInnerChildrenPage');
        // just go back, don't need call `onCallEnd`.
        navigation.goBack();
        origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
      });
    }
    HangupHelper.getInstance().onAutoJump(callbackID, () => {
      zloginfo('########onAutoJump#########', origin, invitees.length);
      hangUpHandle();

      navigation.goBack();
      origin === 'ZegoUIKitPrebuiltCallWaitingScreen' && invitees.length === 1 && navigation.goBack();
    });

    const unsubscribe1 = navigation.addListener('blur', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallInCallScreen, blur');
    })
    const unsubscribe2 = navigation.addListener('focus', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallInCallScreen, focus');
    })
    const unsubscribe3 = navigation.addListener('beforeRemove', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallInCallScreen, beforeRemove');
    })

    return () => {
      zloginfo('ZegoUIKitPrebuiltCallInCallScreen destroy');
      HangupHelper.getInstance().onAutoJump(callbackID);
      CallInviteStateManage.onSomeoneAcceptedInvite(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      BellManage.stopOutgoingSound();
      CallInviteStateManage.initInviteData();
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
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
        onJoinRoom: () => {
          zloginfo('[ZegoUIKitPrebuiltCallInCallScreen] onJoinRoom');
          // If I am not the person who initiated the call, then set a timer to hang up according to the configuration settings
          if (userID !== inviter) {
            if (typeof config.requireInviterConfig == 'object' 
              && config.requireInviterConfig.enabled && config.requireInviterConfig.detectSeconds > 0) {
                startAutoHangUpTimer(config.requireInviterConfig.detectSeconds);
              }
          }
        },
        onCallEnd: (callID, reason, duration) => {
          _onCallEnd(callID, reason, duration)
        },
        avatarBuilder: avatarBuilder,
        onHangUpConfirmation: (typeof config.onHangUpConfirmation === 'function') ? () => {return config.onHangUpConfirmation()} : undefined,
        onUserJoin: (userInfoList) => {
          const foundInviterJoin = userInfoList.some((userInfo, _) => {
            if (inviter === userInfo.userID) {
              return true;
            }
            return false;
          });

          if (foundInviterJoin) {
            zloginfo('[ZegoUIKitPrebuiltCallInCallScreen] found inviter joined room, will clearAutoHangUpTimer');
            clearAutoHangUpTimer();
          }
        },
      }}
    />
  );
}
