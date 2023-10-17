import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoSendInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoInvitationType } from '../services/defines';
import ZegoPrebuiltPlugins from '../services/plugins';
import { useNavigation } from '@react-navigation/native';
import { zloginfo } from '../../utils/logger';
import CallInviteStateManage from '../services/invite_state_manager';
import InnerTextHelper from '../services/inner_text_helper';

export default function ZegoSendCallInvitationButton(props) {
  const navigation = useNavigation();
  const {
    icon,
    text,
    invitees = [],
    isVideoCall = false,
    timeout = 60,
    onWillPressed,
    onPressed,
    width = 42,
    height = 42,
    verticalLayout = false,
    textColor,
    fontSize,
    backgroundColor,
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle,
    resourceID: _resourceID = ''
  } = props;

  const getInviteeIDList = () => {
    return invitees.map(invitee => {
      return invitee.userID
    });
  }

  const localUser = ZegoPrebuiltPlugins.getLocalUser();
  const roomID = `call_${localUser.userID}_${Date.now()}`;
  const data = JSON.stringify({
    call_id: roomID,
    invitees: invitees.map(invitee => {
      return {user_id: invitee.userID, user_name: invitee.userName}
    }),
    type: isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
    inviter: {id: localUser.userID, name: localUser.userName},
    custom_data: '',
  });
  const [forceRender, setForceRender] = useState(Date.now());

  const onPress = ({errorCode, errorMessage, errorInvitees, invitationID, invitees: successfulInvitees }) => {
    CallInviteStateManage.addInviteData(
      invitationID,
      localUser.userID,
      successfulInvitees
    );
    if (invitees.length === 1) {
      // Jump to call waiting page
      zloginfo('Jump to call waiting page.');
      navigation.navigate('ZegoUIKitPrebuiltCallWaitingScreen', {
        roomID,
        isVideoCall,
        invitees,
        inviter: localUser.userID,
        invitationID,
      });
    } else {
      // Jump to call room page
      zloginfo('Jump to call room page.');
      navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen', {
        roomID,
        isVideoCall,
        invitees: getInviteeIDList(),
        inviter: localUser.userID,
        invitationID,
      });
    }
    setForceRender(Date.now());
    if (typeof onPressed === 'function') {
      onPressed(errorCode, errorMessage, errorInvitees);
    }
  };

  return (
    <View style={styles.container}>
      <ZegoSendInvitationButton
        icon={icon}
        text={text}
        invitees={getInviteeIDList()}
        type={
          isVideoCall
            ? ZegoInvitationType.videoCall
            : ZegoInvitationType.voiceCall
        }
        data={data}
        timeout={timeout}
        onWillPressed={onWillPressed}
        onPressed={onPress}
        resourceID={_resourceID}
        width={width}
        height={height}
        color={textColor}
        fontSize={fontSize}
        backgroundColor={backgroundColor}
        verticalLayout={verticalLayout}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        borderColor={borderColor}
        borderStyle={borderStyle}
        notificationTitle={
          InnerTextHelper.instance().getIncomingCallDialogTitle(
            localUser.userName,
            isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
            invitees.length)
        }
        notificationMessage={
          InnerTextHelper.instance().getIncomingCallDialogMessage(
            isVideoCall ? ZegoInvitationType.videoCall : ZegoInvitationType.voiceCall,
            invitees.length
          )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {},
});
