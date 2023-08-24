import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, AppState, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ZegoInvitationType } from '../services/defines';
import CallInviteStateManage from '../services/invite_state_manager';
import { zloginfo } from '../../utils/logger';
import BellManage from '../services/bell';
import InnerTextHelper from '../services/inner_text_helper'
import CallInviteHelper from '../services/call_invite_helper'
import notifee from '@notifee/react-native';

import ZegoUIKit, {
  ZegoAcceptInvitationButton,
  ZegoRefuseInvitationButton,
} from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService from "../../services";
import RNCallKeep from '@zegocloud/react-native-callkeep';

export default function ZegoCallInvitationDialog(props) {
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { showDeclineButton = true, onIncomingCallDeclineButtonPressed, onIncomingCallAcceptButtonPressed } = initConfig;

  const navigation = useNavigation();
  const [isInit, setIsInit] = useState(false);
  const [isDialogVisable, setIsDialogVisable] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inviteType, setInviteType] = useState(ZegoInvitationType.voiceCall);
  const [inviter, setInviter] = useState({});
  const [extendData, setExtendData] = useState({});
  const [callID, setCallID] = useState('');

  const getDialogTitle = () => {
    const count = extendData.invitees ? extendData.invitees.length : 0;
    return InnerTextHelper.instance().getIncomingCallDialogTitle(inviter.name, inviteType, count);
  }
  const getDialogMessage = () => {
    const count = extendData.invitees ? extendData.invitees.length : 0;
    return InnerTextHelper.instance().getIncomingCallDialogMessage(inviteType, count)
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
  const onRefuseCallback = () => {
    if (typeof onIncomingCallDeclineButtonPressed == 'function') {
      onIncomingCallDeclineButtonPressed(navigation)
    }
    setIsDialogVisable(false);
    setIsFullScreen(false);
  }
  const refuseHandle = () => {
    CallInviteHelper.getInstance().refuseCall(callID)
    if (Platform.OS === 'android') {
        RNCallKeep.endAllCalls();
    }
  };
  const onAccectCallback = (data) => {
    zloginfo("onAccectCallback", data.call_id, data.inviter.id)
    if (typeof onIncomingCallAcceptButtonPressed == 'function') {
      onIncomingCallAcceptButtonPressed(navigation)
    }
    setIsDialogVisable(false);
    setIsFullScreen(false);

    navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen', {
      roomID: data.call_id,
      isVideoCall: data.type === ZegoInvitationType.videoCall,
      invitees: data.invitees,
      inviter: data.inviter.id,
    });
  }
  const acceptHandle = () => {
    CallInviteHelper.getInstance().acceptCall(callID, {...extendData, inviteType, inviter});
    if (Platform.OS === 'android') {
        RNCallKeep.endAllCalls();
    }
  };
  const pressHandle = () => {
    setIsFullScreen(true);
  };
  useEffect(() => {
    const callbackID =
      'ZegoCallInvitationDialog' + String(Math.floor(Math.random() * 10000));
    ZegoUIKitPrebuiltCallService.getInstance().onInit(callbackID, () => {
      setIsInit(true);
    })
    CallInviteHelper.getInstance().onCallAccepted(callbackID, onAccectCallback);
    CallInviteHelper.getInstance().onCallRefused(callbackID, onRefuseCallback);

    return () => {
      ZegoUIKitPrebuiltCallService.getInstance().onInit(callbackID);
      CallInviteHelper.getInstance().onCallAccepted(callbackID);
      CallInviteHelper.getInstance().onCallRefused(callbackID);
    };
  }, []);

  useEffect(() => {
    if (isInit) {
      console.log('########Register callbacks after init');
      const callbackID =
        'ZegoCallInvitationDialog' + String(Math.floor(Math.random() * 10000));
      ZegoUIKit.getSignalingPlugin().onInvitationReceived(
        callbackID,
        async ({ callID: invitationID, type, inviter, data }) => {
          let onCall = CallInviteStateManage.isOncall(invitationID);
          const onRoom = ZegoUIKit.isRoomConnected();
          const offlineData = CallInviteHelper.getInstance().getOfflineData();

          if (onCall) {
            await CallInviteStateManage.deleteEndedCall();
            onCall = CallInviteStateManage.isOncall(invitationID);
          }

          if (onCall || (!offlineData && onRoom)) {
            zloginfo(
              `Automatically declining invitations, onCall: ${onCall}, onRoom: ${onRoom}`
            );
            // Automatically declining invitations
            ZegoUIKit.getSignalingPlugin().refuseInvitation(
              inviter.id,
              JSON.stringify({
                callID: invitationID,
                reason: 'busy'
              })
            );
            CallInviteStateManage.updateInviteDataAfterRejected(invitationID);
          } else {
            const currentData = JSON.parse(data);

            if (offlineData && offlineData.call_id === currentData.call_id && offlineData.inviter.id === currentData.inviter.id) {
              CallInviteHelper.getInstance().acceptCall(invitationID, offlineData)
              ZegoUIKit.getSignalingPlugin().acceptInvitation(inviter.id, undefined)
              CallInviteHelper.getInstance().setOfflineData(undefined)
            } else {
              setCallID(invitationID);
              setInviteType(type);
              setInviter(inviter);
              setExtendData(JSON.parse(data));
              setIsDialogVisable(true);
              if (AppState.currentState !== 'background') {
                BellManage.playIncomingSound();
                BellManage.vibrate();
                notifee.cancelAllNotifications();
              }
            }
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
    }
  }, [isInit]);

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
                    {getShotName(inviter.name)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.callName}>{getDialogTitle()}</Text>
                  <Text style={styles.callTitle}>{getDialogMessage()}</Text>
                </View>
              </View>
              <View style={styles.right}>
                {
                  showDeclineButton ? <View style={styles.refuse}>
                    <ZegoRefuseInvitationButton
                      inviterID={inviter.id}
                      onPressed={refuseHandle}
                      data={JSON.stringify({
                        inviterID: inviter.id,
                        reason: 'decline',
                        callID
                      })}
                    />
                  </View> : null
                }
                <View style={styles.accept}>
                  <ZegoAcceptInvitationButton
                    icon={getImageSourceByPath()}
                    inviterID={inviter.id}
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
                  {getShotName(inviter.name)}
                </Text>
              </View>
              <Text style={styles.fullCallName}>{inviter.name}</Text>
              <Text style={styles.calling}>{getDialogMessage()}</Text>
            </View>
            <View style={styles.bottomBarContainer}>
              {
                showDeclineButton ? <View style={styles.fullRefuse}>
                  <ZegoRefuseInvitationButton
                    inviterID={inviter.id}
                    onPressed={refuseHandle}
                    data={JSON.stringify({
                      inviterID: inviter.id,
                      reason: 'decline',
                      callID
                    })}
                  />
                  <Text style={styles.fullRefuseTitle}>{InnerTextHelper.instance().getInnerText().incomingCallPageDeclineButton}</Text>
                </View> : null
              }

              <View style={styles.fullAccept}>
                <ZegoAcceptInvitationButton
                  icon={getImageSourceByPath()}
                  inviterID={inviter.id}
                  onPressed={acceptHandle}
                />
                <Text style={styles.fullAcceptTitle}>{InnerTextHelper.instance().getInnerText().incomingCallPageAcceptButton}</Text>
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
    zIndex: 10000,
    alignItems: 'center',
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
