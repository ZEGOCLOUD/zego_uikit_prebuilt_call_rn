import React, {useState} from 'react';
import ZegoUIKitPrebuiltInvitationCall, {
  ZegoStartCallInvitationButton,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZegoUIKitSignalingPlugin from '@zegocloud/zego-signaling-plugin';
import KeyCenter from './KeyCenter';
import {View, Text, TextInput, StyleSheet} from 'react-native';

export default function CallInvitationHomePage(props) {
  const [text, onChangeText] = useState('');
  const userID = String(Math.floor(Math.random() * 100000));
  return (
    // <View />
    <ZegoUIKitPrebuiltInvitationCall
      appID={KeyCenter.appID}
      appSign={KeyCenter.appSign}
      userID={userID}
      userName={userID}
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
