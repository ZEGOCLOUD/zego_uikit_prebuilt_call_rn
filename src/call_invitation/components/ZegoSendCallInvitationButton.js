import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoSendInvitationButton } from '@zegocloud/zego-uikit-rn';
import { ZegoInvitationType } from '../services/defines';
import ZegoPrebuiltPlugins from '../services/plugins';
import { useNavigation } from '@react-navigation/native';
import InnerTextHelper from '../services/inner_text_helper';
import ZegoUIKitPrebuiltCallInvitation from '../../services/invitation';
import { zloginfo } from '../../utils/logger';
import { eventEmitter, EventName } from '../../utils/EventEmitter';
import PrebuiltCallReport from '../../utils/report';
import CallInviteStateManage from '../services/invite_state_manager';

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
    callID,
    callName,
    showWaitingPageWhenGroupCall = false,
    resourceID: _resourceID = '',
  } = props;

  const getInviteeIDList = () => {
    return invitees.map((invitee) => {
      return invitee.userID;
    });
  };

  const [localUser, setLocalUser] = useState({
    ...ZegoPrebuiltPlugins.getLocalUser(),
  });

  let _roomID = ''

  const isCanSendInvitation = async () => {
    let isOnCall = CallInviteStateManage.isOncall()
    if (isOnCall) {
      return false
    }

    if (typeof onWillPressed === 'function') {
      return onWillPressed();
    } else if (typeof onWillPressed === 'object' && typeof (onWillPressed.then) === 'function' && typeof (onWillPressed.catch) === 'function') {
      let canSendInvitation = true;
      try {
        canSendInvitation = await onWillPressed;
      } catch (error) {
        canSendInvitation = false;
      }
      return canSendInvitation
    } else {
      return true
    }
  }

  const onPress = ({
    errorCode,
    errorMessage,
    errorInvitees,
    invitationID,
    invitees: successfulInvitees,
  }) => {
    PrebuiltCallReport.reportEvent('call/invite', {
      'call_id': invitationID,
      'room_id': callID,
      'source': 'button'
    })

    ZegoUIKitPrebuiltCallInvitation.getInstance().onInvitationSent(
      navigation,
      invitationID,
      invitees,
      successfulInvitees,
      _roomID,
      isVideoCall,
      callName,
      showWaitingPageWhenGroupCall
    );

    if (typeof onPressed === 'function') {
      onPressed(errorCode, errorMessage, errorInvitees);
    }
  };

  const onFailure = ({ code: errorCode, message: errorMessage }) => {
    if (typeof onPressed === 'function') {
      onPressed(errorCode, errorMessage, undefined);
    }
  };

  const loginHandler = ({ userID, userName }) => {
    if (localUser.userID === userID) {
      zloginfo(`[ZegoSendCallInvitationButton][loginHandler] userID not changed, userID: ${userID}`)
      return;
    }

    zloginfo(`[ZegoSendCallInvitationButton][loginHandler] userID: ${userID}, userName: ${userName}`)
    setLocalUser({ userID, userName });
  };

  useEffect(() => {
    zloginfo(`[ZegoSendCallInvitationButton] useEffect`)

    const unsubscribe1 = navigation.addListener('blur', () => {
      zloginfo(
        `[Navigation] ZegoSendCallInvitationButton blur, isVideoCall: ${isVideoCall}`
      );
    });
    const unsubscribe2 = navigation.addListener('focus', () => {
      zloginfo(
        `[Navigation] ZegoSendCallInvitationButton focus, isVideoCall: ${isVideoCall}`
      );
    });
    const unsubscribe3 = navigation.addListener('beforeRemove', () => {
      zloginfo(
        `[Navigation] ZegoSendCallInvitationButton beforeRemove, isVideoCall: ${isVideoCall}`
      );
    });
    eventEmitter.on(EventName.LOGINED, loginHandler);

    return () => {
      zloginfo(`[ZegoSendCallInvitationButton] useEffect return`)

      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      eventEmitter.off(EventName.LOGINED, loginHandler);
    };
  }, []);

  const updateData = () => {
    _roomID = callID ?? `call_${localUser.userID}_${Date.now()}`;
    zloginfo(`ZegoSendCallInvitationButton _roomID: ${_roomID}`);

    const _data = JSON.stringify({
      call_id: _roomID,
      call_name: callName,
      invitees: invitees.map((invitee) => {
        return { user_id: invitee.userID, user_name: invitee.userName };
      }),
      type: isVideoCall
        ? ZegoInvitationType.videoCall
        : ZegoInvitationType.voiceCall,
      inviter: { id: localUser.userID, name: localUser.userName },
      custom_data: '',
    });

    return _data
  }

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
        onRequestData={() => {return updateData()}}
        timeout={timeout}
        onWillPressed={() => {return isCanSendInvitation()}}
        onPressed={onPress}
        onFailure={onFailure}
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
          callName ? callName :
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
