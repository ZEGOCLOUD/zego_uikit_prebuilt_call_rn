import React, {useState} from 'react';
import ZegoUIKitPrebuiltInvitationCall, {
  ZegoStartCallInvitationButton,
  ZegoInvitationType,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
// import ZegoUIKitSignalingPlugin from '@zegocloud/zego-signaling-plugin';
import ZegoUIKitSignalingPlugin from './plugin';
import KeyCenter from './KeyCenter';
import {View, Text, TextInput, StyleSheet, Alert} from 'react-native';

const userID = String(Math.floor(Math.random() * 10000));
const userName = `user_${userID}`;

export default function CallInvitationHomePage(props) {
  const [text, onChangeText] = useState('');
  return (
    // <View />
    <ZegoUIKitPrebuiltInvitationCall
      appID={KeyCenter.appID}
      appSign={KeyCenter.appSign}
      userID={userID}
      userName={userName}
      requireConfig={data => {
        console.warn('requireConfig', data);
        const config =
          data.invitees.length > 1
            ? ZegoInvitationType.videoCall === data.type
              ? GROUP_VIDEO_CALL_CONFIG
              : GROUP_VOICE_CALL_CONFIG
            : ZegoInvitationType.videoCall === data.type
            ? ONE_ON_ONE_VIDEO_CALL_CONFIG
            : ONE_ON_ONE_VOICE_CALL_CONFIG;
        return {
          ...config,
          onHangUp: () => {
            // Custom
          },
          onOnlySelfInRoom: () => {
            // Custom
          },
          onHangUpConfirmation: () => {
            return new Promise((resolve, reject) => {
              Alert.alert('Leave the call', 'Are your sure to leave the call', [
                {
                  text: 'Cancel',
                  onPress: () => {
                    reject();
                  },
                  style: 'cancel',
                },
                {
                  text: 'Confirm',
                  onPress: () => {
                    resolve();
                  },
                },
              ]);
            });
          },
        };
      }}
      plugins={[ZegoUIKitSignalingPlugin]}>
      <View style={styles.container}>
        <Text>Your userID: {userID}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={text}
            placeholder="Invitees ID, Separate ids by ','"
          />
          <ZegoStartCallInvitationButton
            invitees={text ? text.split(',') : []}
            isVideoCall={false}
          />
          <ZegoStartCallInvitationButton
            invitees={text ? text.split(',') : []}
            isVideoCall={true}
          />
        </View>
      </View>
    </ZegoUIKitPrebuiltInvitationCall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
});
