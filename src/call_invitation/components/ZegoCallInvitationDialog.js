import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ZegoInvitationType } from '../services/defines';
import CallInviteStateManage from '../services/inviteStateManager';
import { zloginfo } from '../../utils/logger';
import BellManage from '../services/bell';

import ZegoUIKit, {
  ZegoAcceptInvitationButton,
  ZegoRefuseInvitationButton,
} from '@zegocloud/zego-uikit-rn';

export default function ZegoCallInvitationDialog(props) {
  const navigation = useNavigation();
  const [isDialogVisable, setIsDialogVisable] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inviteType, setInviteType] = useState(ZegoInvitationType.voiceCall);
  const [inviterData, setInviterData] = useState({});
  const [extendData, setExtendData] = useState({});
  const [callID, setCallID] = useState('');

  const getCallTitle = () => {
    return inviteType === ZegoInvitationType.voiceCall
      ? 'ZEGO Voice Call'
      : 'ZEGO Video Call';
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
  const getImageSourceByPath = () => {
    if (inviteType === ZegoInvitationType.videoCall) {
      return require('../resources/button_call_video_accept.png');
    }
  };
  const refuseHandle = () => {
    CallInviteStateManage.updateInviteDataAfterRejected(callID);
    BellManage.stopIncomingSound();
    BellManage.cancleVirate();
    setIsDialogVisable(false);
    setIsFullScreen(false);
  };
  const acceptHandle = () => {
    CallInviteStateManage.updateInviteDataAfterAccepted(callID);
    BellManage.stopIncomingSound();
    BellManage.cancleVirate();
    setIsDialogVisable(false);
    setIsFullScreen(false);
    navigation.navigate('RoomPage', {
      roomID: extendData.call_id,
      isVideoCall: inviteType === ZegoInvitationType.videoCall,
      invitees: extendData.invitees,
      inviter: inviterData.id,
    });
  };
  const pressHandle = () => {
    setIsFullScreen(true);
  };

  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationDialog' + String(Math.floor(Math.random() * 10000));
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(
      callbackID,
      ({ callID: resCallID, type, inviter, data }) => {
        const onCall = CallInviteStateManage.isOncall(resCallID);
        const onRoom = ZegoUIKit.isRoomConnected();
        if (onCall || onRoom) {
          zloginfo(
            `Automatically declining invitations, onCall: ${onCall}, onRoom: ${onRoom}`
          );
          // Automatically declining invitations
          ZegoUIKit.getSignalingPlugin().refuseInvitation(
            inviter.id,
            JSON.stringify({
              callID: resCallID,
            })
          );
          CallInviteStateManage.updateInviteDataAfterRejected(resCallID);
        } else {
          setCallID(resCallID);
          setInviteType(type);
          setInviterData(inviter);
          setExtendData(JSON.parse(data));
          setIsDialogVisable(true);
          BellManage.playIncomingSound();
          BellManage.vibrate();
        }
      }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, () => {
      BellManage.stopIncomingSound();
      BellManage.cancleVirate();
      setIsDialogVisable(false);
      setIsFullScreen(false);
    });
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, () => {
      BellManage.stopIncomingSound();
      BellManage.cancleVirate();
      setIsDialogVisable(false);
      setIsFullScreen(false);
    });
    return () => {
      ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID);
      BellManage.stopIncomingSound();
      BellManage.cancleVirate();
    };
  }, []);

  return (
    <View style={[styles.container, isDialogVisable ? styles.show : null]}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDialogVisable}
        style={styles.modal}
      >
        <View style={styles.mask} />
        {!isFullScreen ? (
          <TouchableOpacity onPress={pressHandle} activeOpacity={0.9}>
            <View style={styles.dialog}>
              <View style={styles.left}>
                <View style={styles.avatar}>
                  <Text style={styles.nameLabel}>
                    {getShotName(inviterData.name)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.callName}>{inviterData.name}</Text>
                  <Text style={styles.callTitle}>{getCallTitle()}</Text>
                </View>
              </View>
              <View style={styles.right}>
                <View style={styles.refuse}>
                  <ZegoRefuseInvitationButton
                    inviterID={inviterData.id}
                    onPressed={refuseHandle}
                  />
                </View>
                <View style={styles.accept}>
                  <ZegoAcceptInvitationButton
                    icon={getImageSourceByPath()}
                    inviterID={inviterData.id}
                    onPressed={acceptHandle}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.fullDialog}>
            <View style={styles.content}>
              <View style={styles.fullAvatar}>
                <Text style={styles.fullNameLabel}>
                  {getShotName(inviterData.name)}
                </Text>
              </View>
              <Text style={styles.fullCallName}>{inviterData.name}</Text>
              <Text style={styles.calling}>Calling...</Text>
            </View>
            <View style={styles.bottomBarContainer}>
              <View style={styles.fullRefuse}>
                <ZegoRefuseInvitationButton
                  inviterID={inviterData.id}
                  onPressed={refuseHandle}
                />
                <Text style={styles.fullRefuseTitle}>Decline</Text>
              </View>
              <View style={styles.fullAccept}>
                <ZegoAcceptInvitationButton
                  icon={getImageSourceByPath()}
                  inviterID={inviterData.id}
                  onPressed={acceptHandle}
                />
                <Text style={styles.fullAcceptTitle}>Accept</Text>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    zIndex: 3,
    alignItems: 'center',
    backgroundColor: 'red',
  },
  mask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: '#333333',
    opacity: 0.4,
  },
  dialog: {
    height: 80,
    backgroundColor: '#333333',
    borderRadius: 8,
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#ffffff',
    borderRadius: 1000,
    color: '#2A2A2A',
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  nameLabel: {
    fontSize: 26,
  },
  callName: {
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 25,
    marginBottom: 3.5,
  },
  callTitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 16.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refuse: {
    marginRight: 20,
  },
  fullDialog: {
    backgroundColor: '#333333',
    width: '100%',
    height: '100%',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    marginTop: 114,
  },
  fullAvatar: {
    width: 100,
    height: 100,
    borderRadius: 1000,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  fullNameLabel: {
    color: '#222222',
    fontSize: 22,
  },
  fullCallName: {
    fontSize: 21,
    lineHeight: 29.5,
    marginBottom: 23.5,
    color: '#ffffff',
  },
  calling: {
    fontSize: 16,
    lineHeight: 22.5,
    color: '#ffffff',
    opacity: 0.7,
  },
  bottomBarContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingLeft: 30,
    paddingRight: 30,
  },
  fullRefuse: {},
  fullRefuseTitle: {
    fontSize: 13,
    opacity: 0.7,
    color: '#FFFFFF',
    lineHeight: 18.5,
    marginTop: 7.5,
  },
  fullAccept: {},
  fullAcceptTitle: {
    fontSize: 13,
    opacity: 0.7,
    color: '#FFFFFF',
    lineHeight: 18.5,
    marginTop: 7.5,
  },
});
