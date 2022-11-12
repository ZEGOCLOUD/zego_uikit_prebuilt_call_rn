import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoStartInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoInvitationType } from '../services/defines';
import ZegoPrebuiltPlugins from '../services/plugins';
import { useNavigation } from '@react-navigation/native';
import { zloginfo } from '../../utils/logger';
import CallInviteStateManage from '../services/inviteStateManager';

export default function ZegoStartCallInvitationButton(props) {
  const navigation = useNavigation();
  const {
    icon,
    text,
    invitees = [],
    isVideoCall = false,
    timeout = 10,
    onPressed,
  } = props;
  const localUser = ZegoPrebuiltPlugins.getLocalUser();
  const roomID = `call_${localUser.userID}_${Date.now()}`;
  const data = JSON.stringify({
    call_id: roomID,
    invitees: invitees.map((inviteeID) => {
      return { user_id: inviteeID, user_name: 'user_' + inviteeID };
    }),
    custom_data: '',
  });

  const onPress = ({ callID, invitees: successfulInvitees }) => {
    CallInviteStateManage.addInviteData(
      callID,
      localUser.userID,
      successfulInvitees
    );
    if (invitees.length === 1) {
      // Jump to call waiting page
      zloginfo('Jump to call waiting page.');
      navigation.navigate('CallPage', {
        roomID,
        isVideoCall,
        invitees,
        inviter: localUser.userID,
        callID,
      });
    } else {
      // Jump to call room page
      zloginfo('Jump to call room page.');
      navigation.navigate('RoomPage', {
        roomID,
        isVideoCall,
        invitees,
        inviter: localUser.userID,
        callID,
      });
    }
    if (typeof onPressed === 'function') {
      onPressed();
    }
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
