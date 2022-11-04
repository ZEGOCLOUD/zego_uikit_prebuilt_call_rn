import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ZegoUIKitInvitationService } from '@zegocloud/zego-uikit-rn';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoUIKitPrebuiltCall from '../call/index';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

export default function ZegoUIKitPrebuiltInvitationCall(props) {
  // const navigation = useNavigation();
  const { appID, appSign, userID, userName, config, plugins } = props;
  const [isDialogVisable, setIsDialogVisable] = useState(false);
  const [notifyData, setNotifyData] = useState({});

  const onAccept = () => {
    setIsDialogVisable(false);
    const callID = JSON.parse(notifyData.data).call_id;
    navigation.navigate('RoomPage', {
      callID,
    });
  };
  const onRefuse = () => {
    setIsDialogVisable(false);
  };
  const onTimeout = () => {
    setIsDialogVisable(false);
  };
  const onCancelled = () => {
    setIsDialogVisable(false);
  };

  useEffect(() => {
    ZegoPrebuiltPlugins.init(appID, appSign, userID, userName, plugins);
  }, [appID, appSign, userID, userName, plugins]);

  useEffect(() => {
    const callbackID =
      'ZegoUIKitPrebuiltInvitationCall' +
      String(Math.floor(Math.random() * 10000));
    ZegoUIKitInvitationService.onCallInvitationReceived(callbackID, (data) => {
      setIsDialogVisable(true);
      setNotifyData(data);
    });
    return () => {
      ZegoUIKitInvitationService.onCallInvitationReceived(callbackID);
    };
  }, []);

  return (
    <View style={styles.customView}>
      {isDialogVisable ? (
        <ZegoCallInvitationDialog
          onAccept={onAccept}
          onRefuse={onRefuse}
          onTimeout={onTimeout}
          onCancelled={onCancelled}
          inviter={notifyData.inviter}
          type={notifyData.type}
        />
      ) : (
        <View />
      )}
      {/* <NavigationContainer initialRouteName="HomePage">
        <Stack.Navigator>
          <Stack.Screen name="HomePage" component={() => props.children} />
        </Stack.Navigator>
        <Stack.Navigator>
          <Stack.Screen
            name="CallPage"
            component={ZegoCallInvitationWaiting}
            appID={appID}
            appSign={appSign}
            userID={userID}
            userName={userName}
          />
        </Stack.Navigator>
        <Stack.Navigator>
          <Stack.Screen
            name="RoomPage"
            component={ZegoUIKitPrebuiltCall}
            appID={appID}
            appSign={appSign}
            userID={userID}
            userName={userName}
            config={config}
          />
        </Stack.Navigator>
      </NavigationContainer> */}
    </View>
  );
}

const styles = StyleSheet.create({
  customView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
});
