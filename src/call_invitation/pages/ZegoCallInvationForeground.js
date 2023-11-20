import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ZegoBottomBar from '../../call/ZegoBottomBar';
import ZegoMenuBarButtonName from '../../call/ZegoMenuBarButtonName';
import { ZegoInvitationType } from '../services/defines';
import InnerTextHelper from '../services/inner_text_helper';
import Delegate from 'react-delegate-component';

export default function ZegoCallInvationForeground(props) {
  const { isVideoCall, invitee, onHangUp, avatarBuilder } = props;
  const userName = invitee.userName;

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
  return (
    <View style={[styles.container, isVideoCall ? styles.opacity : null]}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          {
            !avatarBuilder ?
            <Text style={styles.nameLabel}>{getShotName(userName)}</Text> :
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Delegate
                to={avatarBuilder}
                props={{ userInfo: invitee }}
              />
            </View>
          }
        </View>
        <Text style={styles.userName}>{
          InnerTextHelper.instance().getOutgoingCallPageTitle(userName, isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall)
        }</Text>
        <Text style={styles.calling}>{
          InnerTextHelper.instance().getOutgoingCallPageMessage(isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall)
        }</Text>
      </View>
      <ZegoBottomBar
        menuBarButtons={[ZegoMenuBarButtonName.hangUpButton]}
        onHangUp={onHangUp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333',
    zIndex: 2,
  },
  opacity: {
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    zIndex: 2,
    alignItems: 'center',
    marginTop: 114,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 1000,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    overflow: 'hidden',
  },
  nameLabel: {
    color: '#222222',
    fontSize: 22,
  },
  userName: {
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
});
