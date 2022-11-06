import React from 'react';
import ZegoUIKitPrebuiltInvitationCall, {
  ZegoStartCallInvitationButton,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZegoUIKitSignalingPlugin from '@zegocloud/zego-signaling-plugin';
import KeyCenter from './KeyCenter';
import {View, Text, StyleSheet} from 'react-native';

export default function CallInvitationHomePage(props) {
  const userID = '8901';
  const userName = '8901';
  const invitees = ['1234'];
  const isVideoCall = false;
  return (
    <ZegoUIKitPrebuiltInvitationCall
      appID={KeyCenter.appID}
      appSign={KeyCenter.appSign}
      userID={userID}
      userName={userName}
      plugins={[ZegoUIKitSignalingPlugin]}>
      <View style={styles.container}>
        <ZegoStartCallInvitationButton
          invitees={invitees}
          isVideoCall={isVideoCall}
        />
        <ZegoStartCallInvitationButton
          invitees={invitees}
          isVideoCall={!isVideoCall}
        />
      </View>
    </ZegoUIKitPrebuiltInvitationCall>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
  },
});
