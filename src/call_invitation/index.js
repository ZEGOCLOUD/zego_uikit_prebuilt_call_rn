import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
  const [isInit, setIsInit] = useState(false);
  const [notifyData, setNotifyData] = useState({});

  useEffect(() => {
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(
      () => {
        setIsInit(true);
      }
    );
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
        {isInit ? (
          <ZegoCallInvitationDialog
            visable={isDialogVisable}
            inviter={notifyData.inviter}
            type={notifyData.type}
            callID={notifyData.data}
          />
        ) : (
          <View />
        )}
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
            initialParams={{
              appID,
              appSign,
              userID,
              userName,
            }}
          />
          {/* <Stack.Screen
            options={{ headerShown: false }}
            name="RoomPage"
            component={ZegoUIKitPrebuiltCall}
            initialParams={{
              appID,
              appSign,
              userID,
              userName,
              config
            }}
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
