import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, PermissionsAndroid, BackHandler } from 'react-native';
import ZegoUIKit, {
  ZegoAudioVideoView,
  ZegoSwitchCameraButton,
} from '@zegocloud/zego-uikit-rn';
import ZegoCallInvationForeground from './ZegoCallInvationForeground';
import BellManage from '../services/bell';
import { zloginfo } from '../../utils/logger';
import CallInviteStateManage from '../services/invite_state_manager';
import { useNavigation } from '@react-navigation/native';
import ZegoUIKitPrebuiltCallService from '../../services';

export default function ZegoUIKitPrebuiltCallWaitingScreen(props) {
  const navigation = useNavigation();
  const { appID, appSign } = ZegoUIKitPrebuiltCallService.getInstance().getInitAppInfo();
  const { userID, userName } = ZegoUIKitPrebuiltCallService.getInstance().getInitUser();
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { onOutgoingCallCancelButtonPressed, avatarBuilder, waitingPageConfig } = initConfig;
  const { route } = props;
  const {
    roomID,
    isVideoCall,
    invitees,
    inviter,
    invitationID,
    callName,
  } = route.params;

  const getInviteeIDList = () => {
    return invitees.map(invitee => {
      return invitee.userID
    });
  }
  const grantPermissions = async (callback) => {
    // Android: Dynamically obtaining device permissions
    if (Platform.OS === 'android') {
      // Check if permission granted
      let grantedAudio = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      let grantedCamera = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const ungrantedPermissions = [];
      try {
        const isAudioGranted = await grantedAudio;
        const isVideoGranted = await grantedCamera;
        if (!isAudioGranted) {
          ungrantedPermissions.push(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
        }
        if (!isVideoGranted && isVideoCall) {
          ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
      } catch (error) {
        ungrantedPermissions.push(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
      }
      // If not, request it
      zloginfo(`[ZegoUIKitPrebuiltCallWaitingScreen] requestMultiple, ungrantedPermissions: ${ungrantedPermissions}`);
      return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
        (result) => {
          zloginfo(`[ZegoUIKitPrebuiltCallWaitingScreen] requestMultiple, result: ${result}`);
          if (callback) {
            callback();
          }
        }
      );
    } else if (callback) {
      callback();
    }
  };
  const hangUpHandle = () => {
    zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] hangUpHandle, Leave room on waiting page');

    ZegoUIKit.uninit();
    if (typeof onOutgoingCallCancelButtonPressed == 'function') {
      onOutgoingCallCancelButtonPressed(navigation, roomID, invitees, isVideoCall ? 1 : 0);
    }
    if (CallInviteStateManage.isAutoCancelInvite(invitationID)) {
      ZegoUIKit.getSignalingPlugin().cancelInvitation(getInviteeIDList(), JSON.stringify({"call_id": roomID, "operation_type": "cancel_invitation"}));
      CallInviteStateManage.updateInviteDataAfterCancel(invitationID);
    }
    BellManage.stopOutgoingSound();
    CallInviteStateManage.initInviteData();
    navigation.goBack();
  };

  useEffect(() => {
    BellManage.playOutgoingSound();
    ZegoUIKit.init(appID, appSign, { userID, userName }).then(() => {
      ZegoUIKit.turnCameraOn('', isVideoCall);
      ZegoUIKit.turnMicrophoneOn('', true);
      ZegoUIKit.setAudioOutputToSpeaker(true);
      grantPermissions(() => {
        // ZegoUIKit.joinRoom(roomID);
      });
    });
    const unsubscribe1 = navigation.addListener('blur', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, blur');
    })
    const unsubscribe2 = navigation.addListener('focus', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, focus');
    })
    const unsubscribe3 = navigation.addListener('beforeRemove', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, beforeRemove');
    })
    return () => {
      BellManage.stopOutgoingSound();
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackButton = () => {
    return true;
  }

  useEffect(() => {
    const callbackID =
      'ZegoUIKitPrebuiltCallWaitingScreen' + String(Math.floor(Math.random() * 10000));
    if (invitees.length === 1) {
      ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, () => {
        zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] onInvitationResponseTimeout');

        ZegoUIKit.uninit();
        BellManage.stopOutgoingSound();
        // ZegoUIKit.leaveRoom();
        CallInviteStateManage.initInviteData();
        navigation.goBack();
      });
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, (data) => {
        zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] onInvitationRefused');

        ZegoUIKit.uninit();
        const callIDs = Array.from(CallInviteStateManage._invitationMap.keys());
        if (callIDs.includes(data.callID)) {
          BellManage.stopOutgoingSound();
          // ZegoUIKit.leaveRoom();
          CallInviteStateManage.initInviteData();
          navigation.goBack();
        }
      });
    } else {
      // CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
      //   zloginfo('Someone accepted the invitation');
      //   BellManage.stopOutgoingSound();
      // });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] onInviteCompletedWithNobody');

        ZegoUIKit.uninit();
        navigation.goBack();
      });
    }
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(
      callbackID,
      ({ invitee, data }) => {
        zloginfo('Jump to call room page.');
        BellManage.stopOutgoingSound();
        // ZegoUIKit.leaveRoom().then(() => {
          navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen', {
            origin: 'ZegoUIKitPrebuiltCallWaitingScreen',
            roomID,
            isVideoCall,
            invitees: getInviteeIDList(),
            inviter,
            invitationID,
          });
        // });
      }
    );

    BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    navigation.setOptions({ gestureEnabled: false });

    return () => {
      ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
      navigation.setOptions({ gestureEnabled: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {isVideoCall ? (
        <ZegoAudioVideoView
          userID={userID}
          roomID={roomID}
          useVideoViewAspectFill={true}
          // eslint-disable-next-line react/no-unstable-nested-components
          foregroundBuilder={() => (
            <ZegoCallInvationForeground
              isVideoCall={isVideoCall}
              invitee={invitees[0]}
              onHangUp={hangUpHandle}
              avatarBuilder={avatarBuilder}
              waitingPageConfig={waitingPageConfig}
              callName={callName}
              isGroupCall={invitees.length > 1}
            />
          )}
        />
      ) : (
        <ZegoCallInvationForeground
          isVideoCall={isVideoCall}
          invitee={invitees[0]}
          onHangUp={hangUpHandle}
          avatarBuilder={avatarBuilder}
          waitingPageConfig={waitingPageConfig}
          callName={callName}
          isGroupCall={invitees.length > 1}
        />
      )}
      {isVideoCall ? (
        <View style={styles.topMenuContainer}>
          <ZegoSwitchCameraButton iconBuilder={waitingPageConfig.switchCameraBuilder} />
        </View>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  topMenuContainer: {
    zIndex: 2,
    width: '100%',
    paddingRight: 15,
    top: 30,
    alignItems: 'flex-end',
  },
});
