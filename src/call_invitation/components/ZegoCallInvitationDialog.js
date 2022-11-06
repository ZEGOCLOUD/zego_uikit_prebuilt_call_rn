import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ZegoInvitationType } from '../services/defines';
import {
  ZegoUIKitInvitationService,
  ZegoAcceptInvitationButton,
  ZegoRefuseInvitationButton,
} from '@zegocloud/zego-uikit-rn';

export default function ZegoCallInvitationDialog(props) {
  const {
    inviter = {},
    type = ZegoInvitationType.voiceCall,
    callID,
    visable,
  } = props;
  const navigation = useNavigation();
  const [isDialogVisable, setIsDialogVisable] = useState(!!visable);
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
  const refuseHandle = () => {
    setIsDialogVisable(false);
  };
  const acceptHandle = () => {
    setIsDialogVisable(false);
    navigation.navigate('RoomPage', {
      callID,
    });
  };

  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationDialog' + String(Math.floor(Math.random() * 10000));
    ZegoUIKitInvitationService.onInvitationTimeout(callbackID, () => {
      setIsDialogVisable(false);
    });
    ZegoUIKitInvitationService.onInvitationCanceled(callbackID, () => {
      setIsDialogVisable(false);
    });
    return () => {
      ZegoUIKitInvitationService.onInvitationTimeout(callbackID);
      ZegoUIKitInvitationService.onInvitationCanceled(callbackID);
    };
  }, []);

  return (
    <View style={[styles.container, isDialogVisable ? styles.show : null]}>
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
            onPressed={refuseHandle}
          />
          <ZegoAcceptInvitationButton
            icon={getImageSourceByPath()}
            inviterID={inviter.userID}
            onPressed={acceptHandle}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'none',
  },
  show: {
    display: 'flex',
  },
  mask: {},
  dialog: {},
  left: {},
  avatar: {},
  nameLabel: {},
  callName: {},
  callTitle: {},
  right: {},
});
