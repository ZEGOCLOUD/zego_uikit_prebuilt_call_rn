import React, { useState, useRef, useEffect } from 'react';
import {
  ZegoUIKitPrebuiltCallWithInvitation,
  ZegoSendCallInvitationButton,
  ZegoInvitationType,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
// import ZegoUIKitSignalingPlugin from '@zegocloud/zego-uikit-signaling-plugin-rn';

import ZegoUIKitSignalingPlugin from './plugin/index';
import KeyCenter from './KeyCenter';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';


function getZPNsMessagePayload(message) {
  return message.extras['payload']
}

function getCallID(message) {
  var payload = JSON.parse(message.extras['payload']);

  return payload['call_id']
}

var userID = String(Math.floor(Math.random() * 10000));
if (Platform.OS === "ios") {
  userID = "365"
} else {
  userID = "12333"
}
const userName = `user_${userID}`;

export default function CallWithInvitationPage(props) {
  const [invitees, setInvitees] = useState([]);
  const [zpnState, setZpnState] = useState("")
  const viewRef = useRef(null);
  const pressHandle = () => {
    viewRef.current.blur();
  };
  const changeTextHandle = value => {
    setInvitees(value ? value.split(',') : []);
  };

  return (
    <ZegoUIKitPrebuiltCallWithInvitation
      appID={KeyCenter.appID}
      appSign={KeyCenter.appSign}
      userID={userID}
      userName={userName}
      config={{
        ringtoneConfig: {
          incomingCallFileName: 'zego_incoming.mp3',
          outgoingCallFileName: 'zego_outgoing.mp3',
        },
        plugins: [ZegoUIKitSignalingPlugin],
        requireConfig: (data) => {
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
        }
      }}
    >
      <TouchableWithoutFeedback onPress={pressHandle}>
        <View style={styles.container}>
          <Text>ZPNs message: {zpnState}</Text>
          <Text>Your userID: {userID}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={viewRef}
              style={styles.input}
              onChangeText={changeTextHandle}
              placeholder="Invitees ID, Separate ids by ','"
            />
            <ZegoSendCallInvitationButton
              invitees={invitees}
              isVideoCall={false}
              resourcesID={"zegouikit_call"}
            />
            <ZegoSendCallInvitationButton
              invitees={invitees}
              isVideoCall={true}
              resourcesID={"zegouikit_call"}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ZegoUIKitPrebuiltCallWithInvitation>
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
