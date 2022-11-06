import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ZegoUIKit, {
  ZegoAudioVideoView,
  ZegoSwitchCameraButton,
  ZegoLeaveButton,
  ZegoUIKitInvitationService,
} from '@zegocloud/zego-uikit-rn';

export default function ZegoCallInvitationWaiting(props) {
  const navigation = useNavigation();
  const { appID, appSign, userID, userName, callID, isVideoCall } = props;

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
  const getShotName = (name) => {
    if (!name) {
      return '';
    }
    const nl = name.split(' ');
    var shotName = '';
    nl.forEach((part) => {
      if (part !== '') {
        shotName += part.substring(0, 1);
      }
    });
    return shotName;
  };

  useEffect(() => {
    ZegoUIKit.init(appID, appSign, { userID, userName }).then(() => {
      if (isVideoCall) {
        ZegoUIKit.turnCameraOn(userID, true);
      }
      grantPermissions(() => {
        ZegoUIKit.joinRoom(callID);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationWaiting' + String(Math.floor(Math.random() * 10000));
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
      });
    });
    return () => {
      ZegoUIKitInvitationService.onInvitationResponseTimeout(callbackID);
      ZegoUIKitInvitationService.onInvitationRefused(callbackID);
      ZegoUIKitInvitationService.onInvitationAccepted(callbackID);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {isVideoCall ? (
        <View style={styles.topMenuContainer}>
          <ZegoSwitchCameraButton />
        </View>
      ) : (
        <View />
      )}
      {isVideoCall ? (
        <ZegoAudioVideoView userID={userID} roomID={callID} />
      ) : (
        <View />
      )}
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.nameLabel}>{getShotName(userName)}</Text>
        </View>
        <Text>{userName}</Text>
        <Text>Calling...</Text>
      </View>
      <View style={styles.bottomMenuContainer}>
        <ZegoLeaveButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
