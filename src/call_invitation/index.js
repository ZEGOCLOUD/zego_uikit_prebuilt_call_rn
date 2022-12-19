import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoCallInvitationRoom from './pages/ZegoCallInvitationRoom';
import CallInviteStateManage from '../call_invitation/services/inviteStateManager';
import BellManage from '../call_invitation/services/bell';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ZegoUIKit from '@zegocloud/zego-uikit-rn'
const Stack = createNativeStackNavigator();

export default function ZegoUIKitPrebuiltCallWithInvitation(props) {
  const {
    appID,
    appSign,
    userID,
    userName,
    token,
    onRequireNewToken,
    config = {}
  } = props;
  const {
    requireConfig,
    plugins,
    ringtoneConfig = {
      incomingCallFileName: 'zego_incoming.mp3',
      outgoingCallFileName: 'zego_outgoing.mp3',
    },
    showDeclineButton = true,
    notifyWhenAppRunningInBackgroundOrQuit = true,
  } = config
  const [isInit, setIsInit] = useState(false);

  const handleAppStateChange = (nextAppState) => {
    if (isInit) {
      if (nextAppState === 'active') {
        ZegoPrebuiltPlugins.reconnectIfDisconnected();
      }
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(
      () => {
        setIsInit(true);
        CallInviteStateManage.init();
        BellManage.initRingtoneConfig(ringtoneConfig);
        BellManage.initIncomingSound();
        BellManage.initOutgoingSound();
      }
    );

    // Enable offline notification
    ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(notifyWhenAppRunningInBackgroundOrQuit);

    return () => {
      BellManage.releaseIncomingSound();
      BellManage.releaseOutgoingSound();
      CallInviteStateManage.uninit();
      ZegoPrebuiltPlugins.uninit();
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <NavigationContainer initialRouteName="UserPage">
        {isInit ? <ZegoCallInvitationDialog /> : <View />}
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            headerMode="none"
            name="UserPage"
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
              token,
              onRequireNewToken,
            }}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name="RoomPage"
            component={ZegoCallInvitationRoom}
            initialParams={{
              appID,
              appSign,
              userID,
              userName,
              token,
              onRequireNewToken,
              requireConfig,
            }}
          />
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
