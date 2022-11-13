import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, PermissionsAndroid } from 'react-native';
import ZegoUIKit, {
  ZegoAudioVideoView,
  ZegoSwitchCameraButton,
  ZegoUIKitInvitationService,
} from '@zegocloud/zego-uikit-rn';
import ZegoCallInvationForeground from './ZegoCallInvationForeground';
import BellManage from '../services/bell';
import { zloginfo } from '../../utils/logger';
import CallInviteStateManage from '../services/inviteStateManager';

export default function ZegoCallInvitationWaiting(props) {
  const { route, navigation } = props;
  const {
    appID,
    appSign,
    userID,
    userName,
    token,
    onRequireNewToken,
    roomID,
    isVideoCall,
    invitees,
    inviter,
    callID,
  } = route.params;

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
        if (!isVideoGranted) {
          ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
      } catch (error) {
        ungrantedPermissions.push(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
      }
      // If not, request it
      return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
        (data) => {
          console.warn('requestMultiple', data);
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
    zloginfo('Leave room on waiting page');
    if (CallInviteStateManage.isAutoCancelInvite(callID)) {
      ZegoUIKitInvitationService.cancelInvitation(invitees);
      CallInviteStateManage.updateInviteDataAfterCancel(callID);
    }
    BellManage.stopOutgoingSound();
    navigation.goBack();
  };

  useEffect(() => {
    BellManage.playOutgoingSound();
    ZegoUIKit.init(appID, appSign, { userID, userName }).then(() => {
      if (isVideoCall) {
        ZegoUIKit.turnCameraOn('', true);
        ZegoUIKit.turnMicrophoneOn('', true);
        ZegoUIKit.setAudioOutputToSpeaker(true);
      }
      grantPermissions(() => {
        if (appSign) {
          ZegoUIKit.joinRoom(roomID);
        } else {
          ZegoUIKit.joinRoom(roomID, token || onRequireNewToken());
        }
      });
    });
    return () => {
      BellManage.stopOutgoingSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationWaiting' + String(Math.floor(Math.random() * 10000));
    ZegoUIKit.onRequireNewToken(callbackID, onRequireNewToken);
    ZegoUIKitInvitationService.onInvitationResponseTimeout(callbackID, () => {
      BellManage.stopOutgoingSound();
      ZegoUIKit.leaveRoom();
      navigation.goBack();
    });
    ZegoUIKitInvitationService.onInvitationRefused(callbackID, () => {
      BellManage.stopOutgoingSound();
      ZegoUIKit.leaveRoom();
      navigation.goBack();
    });
    ZegoUIKitInvitationService.onInvitationAccepted(
      callbackID,
      ({ invitee, data }) => {
        zloginfo('Jump to call room page.');
        BellManage.stopOutgoingSound();
        navigation.navigate('RoomPage', {
          roomID,
          isVideoCall,
          invitees,
          inviter,
          callID,
        });
      }
    );
    return () => {
      ZegoUIKit.onRequireNewToken(callbackID);
      ZegoUIKitInvitationService.onInvitationResponseTimeout(callbackID);
      ZegoUIKitInvitationService.onInvitationRefused(callbackID);
      ZegoUIKitInvitationService.onInvitationAccepted(callbackID);
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
              userName={userName}
              onHangUp={hangUpHandle}
            />
          )}
        />
      ) : (
        <ZegoCallInvationForeground
          isVideoCall={isVideoCall}
          userName={userName}
          onHangUp={hangUpHandle}
        />
      )}
      {isVideoCall ? (
        <View style={styles.topMenuContainer}>
          <ZegoSwitchCameraButton />
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
