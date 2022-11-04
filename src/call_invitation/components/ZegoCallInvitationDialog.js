import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ZegoInvitationType } from '../services/defines';
import {
  ZegoUIKitInvitationService,
  ZegoAcceptInvitationButton,
  ZegoRefuseInvitationButton,
} from '@zegocloud/zego-uikit-rn';

export default function ZegoCallInvitationDialog(props) {
  const {
    onAccept,
    onRefuse,
    onTimeout,
    onCancelled,
    inviter = {},
    type = ZegoInvitationType.voiceCall,
  } = props;
  const callTitle =
    type === ZegoInvitationType.voiceCall
      ? 'ZEGO Voice Call'
      : 'ZEGO Video Call';

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
  const getImageSourceByPath = () => {
    if (type === ZegoInvitationType.videoCall) {
      return require('../resources/button_call_video_accept.png');
    }
  };

  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationDialog' + String(Math.floor(Math.random() * 10000));
    ZegoUIKitInvitationService.onInvitationTimeout(callbackID, () => {
      onTimeout();
    });
    ZegoUIKitInvitationService.onInvitationCanceled(callbackID, () => {
      onCancelled();
    });
    return () => {
      ZegoUIKitInvitationService.onInvitationTimeout(callbackID);
      ZegoUIKitInvitationService.onInvitationCanceled(callbackID);
    };
  }, [onCancelled, onTimeout]);

  return (
    <View>
      <View style={styles.mask} />
      <View style={styles.dialog}>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.nameLabel}>
              {getShotName(inviter.userName)}
            </Text>
          </View>
          <View>
            <Text style={styles.callName}>{inviter.userName}</Text>
            <Text style={styles.callTitle}>{callTitle}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <ZegoRefuseInvitationButton
            inviterID={inviter.userID}
            onPressed={onRefuse}
          />
          <ZegoAcceptInvitationButton
            icon={getImageSourceByPath()}
            inviterID={inviter.userID}
            onPressed={onAccept}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {},
  dialog: {},
  left: {},
  avatar: {},
  nameLabel: {},
  callName: {},
  callTitle: {},
  right: {},
});
