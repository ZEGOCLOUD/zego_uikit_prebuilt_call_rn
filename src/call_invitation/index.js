import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoUIKitInvitationService } from '@zegocloud/zego-uikit-rn';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoUIKitPrebuiltCall from '../call/index';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

export default function ZegoUIKitPrebuiltInvitationCall(props) {
  const { appID, appSign, userID, userName, config, plugins } = props;
  const [isDialogVisable, setIsDialogVisable] = useState(false);
  const [notifyData, setNotifyData] = useState({});

  useEffect(() => {
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const callbackID =
      'ZegoUIKitPrebuiltInvitationCall' +
      String(Math.floor(Math.random() * 10000));
    ZegoUIKitInvitationService.onInvitationReceived(callbackID, (data) => {
      setIsDialogVisable(true);
      setNotifyData(data);
    });
    return () => {
      ZegoUIKitInvitationService.onInvitationReceived(callbackID);
    };
  }, []);

  return (
    <View style={styles.container}>
      <NavigationContainer initialRouteName="HomePage">
        <ZegoCallInvitationDialog
          visable={isDialogVisable}
          inviter={notifyData.inviter}
          type={notifyData.type}
          callID={notifyData.data}
        />
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            headerMode="none"
            name="HomePage"
            children={() => props.children}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="CallPage"
            component={ZegoCallInvitationWaiting}
            appID={appID}
            appSign={appSign}
            userID={userID}
            userName={userName}
          />
          {/* <Stack.Screen
            options={{ headerShown: false }}
            name="RoomPage"
            component={ZegoUIKitPrebuiltCall}
            appID={appID}
            appSign={appSign}
            userID={userID}
            userName={userName}
            config={config}
          /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 0,
    backgroundColor: '#dddddd',
  },
});
