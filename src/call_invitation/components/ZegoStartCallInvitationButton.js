import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoStartInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoInvitationType } from '../services/defines';
import ZegoPrebuiltPlugins from '../services/plugins';
import { useNavigation } from '@react-navigation/native';

export default function ZegoStartCallInvitationButton(props) {
  const navigation = useNavigation();
  const {
    icon,
    text,
    invitees = [],
    isVideoCall = false,
    timeout = 60,
    onPressed,
  } = props;
  const localUser = ZegoPrebuiltPlugins.getLocalUser();
  const callID = `call_${localUser.userID}`;
  const data = JSON.stringify({
    call_id: callID,
    invitees,
  });
  const onPress = () => {
    if (invitees.length === 1) {
      // Jump to call waiting page
      navigation.navigate('CallPage', {
        callID,
        isVideoCall,
      });
    } else {
      // Jump to call room page
      navigation.navigate('RoomPage', {
        callID,
      });
    }
    onPressed();
  };
  return (
    <View style={styles.container}>
      <ZegoStartInvitationButton
        icon={icon}
        text={text}
        invitees={invitees}
        type={
          isVideoCall
            ? ZegoInvitationType.videoCall
            : ZegoInvitationType.voiceCall
        }
        data={data}
        timeout={timeout}
        onPressed={onPress}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {},
});
