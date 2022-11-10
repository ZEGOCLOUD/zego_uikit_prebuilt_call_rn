import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, PermissionsAndroid } from 'react-native';

import ZegoUIKit, {
  ZegoAudioVideoView,
  ZegoSwitchCameraButton,
  ZegoUIKitInvitationService,
} from '@zegocloud/zego-uikit-rn';
import ZegoCallInvationForeground from './ZegoCallInvationForeground';

export default function ZegoCallInvitationWaiting(props) {
  const { route, navigation } = props;
  const {
    appID,
    appSign,
    userID,
    userName,
    callID,
    isVideoCall,
    token,
    onRequireNewToken,
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
  const onHangUp = () => {
    ZegoUIKit.leaveRoom();
    navigation.goBack();
  };

  useEffect(() => {
    ZegoUIKit.init(appID, appSign, { userID, userName }).then(() => {
      if (isVideoCall) {
        ZegoUIKit.turnCameraOn(userID, true);
      }
      grantPermissions(() => {
        if (appSign) {
          ZegoUIKit.joinRoom(callID);
        } else {
          ZegoUIKit.joinRoom(callID, token || onRequireNewToken());
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationWaiting' + String(Math.floor(Math.random() * 10000));
    ZegoUIKit.onRequireNewToken(callbackID, onRequireNewToken);
    ZegoUIKitInvitationService.onInvitationResponseTimeout(callbackID, () => {
      ZegoUIKit.leaveRoom();
      navigation.goBack();
    });
    ZegoUIKitInvitationService.onInvitationRefused(callbackID, () => {
      ZegoUIKit.leaveRoom();
      navigation.goBack();
    });
    ZegoUIKitInvitationService.onInvitationAccepted(callbackID, () => {
      navigation.navigate('RoomPage', {
        callID,
        isVideoCall,
      });
    });
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
          roomID={callID}
          useVideoViewAspectFill={true}
          // eslint-disable-next-line react/no-unstable-nested-components
          foregroundBuilder={() => (
            <ZegoCallInvationForeground
              isVideoCall={isVideoCall}
              userName={userName}
              onHangUp={onHangUp}
            />
          )}
        />
      ) : (
        <ZegoCallInvationForeground
          isVideoCall={isVideoCall}
          userName={userName}
          onHangUp={onHangUp}
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
