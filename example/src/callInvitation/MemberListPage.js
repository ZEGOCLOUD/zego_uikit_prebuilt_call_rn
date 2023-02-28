import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import ZegoCallKit, { ZegoSendCallInvitationButton } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import {useNavigation} from '@react-navigation/native';

export default function MemberListPage(props) {
  const navigation = useNavigation();
  const [invitees, setInvitees] = useState([]);
  const viewRef = useRef(null);
  const blankPressedHandle = () => {
    viewRef.current.blur();
  };
  const changeTextHandle = value => {
    setInvitees(value ? value.split(',') : []);
  };
  const willPressedHandle = () => {
    // Block the method of sending an invitation
    // If true is returned, it will be sent
    // If false is returned, it will not be sent
  
    // Your code...

    // Synchronization example
    // return true;
    
    // Asynchronous example, an asynchronous method is simulated here
    return new Promise((resolve, reject) => {
      resolve(true);
    })
  };

  useEffect(() => {
    const callbackID = 'MemberListPage' + String(Math.floor(Math.random() * 10000));
    ZegoCallKit.onRouteChange(callbackID, ({ name, params }) => {
      if (name === 'ZegoCallInvitationWaitingPage') {
        navigation.navigate('ZegoCallInvitationWaitingPage', params);
        console.log('Jump to call waiting page.');
      } else if (name === 'ZegoCallInvitationRoomPage') {
        console.log('Jump to call room page.');
        navigation.navigate('ZegoCallInvitationRoomPage', params);
      } else if (name === 'ZegoInnerChildrenPage') {
        console.log('Jump to custom page.');
        navigation.navigate('MemberListPage');
      }
    });
    
    return () => {
      ZegoCallKit.onRouteChange(callbackID);
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={blankPressedHandle}>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={viewRef}
            style={styles.input}
            onChangeText={changeTextHandle}
            placeholder="Invitees ID, Separate ids by ','"
          />
          <ZegoSendCallInvitationButton
            invitees={invitees.map((inviteeID) => {
              return { userID: inviteeID, userName: 'user_' + inviteeID };
            })}
            isVideoCall={false}
            onWillPressed={willPressedHandle}
          />
          <ZegoSendCallInvitationButton
            invitees={invitees.map((inviteeID) => {
              return { userID: inviteeID, userName: 'user_' + inviteeID };
            })}
            isVideoCall={true}
            onWillPressed={willPressedHandle}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
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
