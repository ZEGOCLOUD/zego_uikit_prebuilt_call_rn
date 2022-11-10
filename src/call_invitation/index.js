import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoCallInvitationRoom from './pages/ZegoCallInvitationRoom';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

export default function ZegoUIKitPrebuiltInvitationCall(props) {
  const {
    appID,
    appSign,
    userID,
    userName,
    token,
    onRequireNewToken,
    requireConfig,
    plugins,
  } = props;
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins).then(
      () => {
        setIsInit(true);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <NavigationContainer initialRouteName="HomePage">
        {isInit ? <ZegoCallInvitationDialog /> : <View />}
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
