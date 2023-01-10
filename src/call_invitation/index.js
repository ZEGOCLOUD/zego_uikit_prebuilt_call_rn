import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoCallInvitationRoom from './pages/ZegoCallInvitationRoom';
import CallInviteStateManage from '../call_invitation/services/inviteStateManager';
import BellManage from '../call_invitation/services/bell';
import InnerTextHelper from './services/inner_text_helper';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ZegoUIKit from '@zegocloud/zego-uikit-rn'
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

const Stack = createNativeStackNavigator();

function CallEventListener(props) {
  const navigation = useNavigation();
  const {
    androidNotificationChannelID = "",
    notifyWhenAppRunningInBackgroundOrQuit = true,
    isIOSDevelopmentEnvironment = true,

    onIncomingCallReceived,
    onIncomingCallCanceled,
    onOutgoingCallAccepted,
    onOutgoingCallRejected,
    onOutgoingCallDeclined,
    onIncomingCallTimeout,
    onOutgoingCallTimeout
  } = props;


  const showBackgroundNotification = async (inviterName, type, invitees) => {
    const count = invitees ? invitees.length : 0;

    if (AppState.currentState != "background" || Platform.OS == 'ios') {
      return;
    }
    notifee.displayNotification({
      title: InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, count),
      body: InnerTextHelper.instance().getIncomingCallDialogMessage(type, count),
      data: {},
      android: {
        channelId: androidNotificationChannelID,
        // Launch the app on lock screen
        fullScreenAction: {
          // For Android Activity other than the default:
          id: 'full_screen_body_press',
          launchActivity: 'default',
        },
        pressAction: {
          id: 'body_press',
          launchActivity: 'default',
        },
      },
    });
  }

  const _getInviteesFromData = (data) => {
    var invitees = JSON.parse(data).invitees
    return invitees.map((invitee) => {
      return { userID: invitee.user_id, userName: invitee.user_name }
    })
  }
  const _registerCallback = (callbackID) => {
    ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, ({ callID, invitees, data }) => {
      if (typeof onOutgoingCallTimeout == 'function') {
        onOutgoingCallTimeout(navigation, callID, invitees.map((invitee) => {
          return { userID: invitee.id, userName: invitee.name }
        }))
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
      const jsonData = data ? JSON.parse(data) : undefined;
      if (jsonData && jsonData.reason == 'busy') {
        if (typeof onOutgoingCallRejected == 'function') {
          onOutgoingCallRejected(navigation, callID, { userID: invitee.id, userName: invitee.name })
        }
      } else {
        if (typeof onOutgoingCallDeclined == 'function') {
          onOutgoingCallDeclined(navigation, callID, { userID: invitee.id, userName: invitee.name })
        }
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ callID, invitee, data }) => {
      if (typeof onOutgoingCallAccepted == 'function') {
        onOutgoingCallAccepted(navigation, callID, { userID: invitee.id, userName: invitee.name })
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }) => {
      const invitees = _getInviteesFromData(data)
      // Listen and show notification on background
      showBackgroundNotification(inviter.name, type, invitees)

      if (typeof onIncomingCallReceived == 'function') {
        onIncomingCallReceived(navigation, callID, { userID: inviter.id, userName: inviter.name }, type, invitees)
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
      if (typeof onIncomingCallCanceled == 'function') {
        onIncomingCallCanceled(navigation, callID, { userID: inviter.id, userName: inviter.name })
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter, data }) => {
      if (typeof onIncomingCallTimeout == 'function') {
        onIncomingCallTimeout(navigation, callID, { userID: inviter.id, userName: inviter.name })
      }
    }
    );
  }
  const _unregisterCallback = (callbackID) => {
    ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID);
    ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID);
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID);
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID);
  }
  useEffect(() => {
    // Enable offline notification
    ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(notifyWhenAppRunningInBackgroundOrQuit, isIOSDevelopmentEnvironment);


    const callbackID = 'ZegoUIKitPrebuiltCallWithInvitation ' + String(Math.floor(Math.random() * 10000));
    _registerCallback(callbackID);

    return () => {
      _unregisterCallback(callbackID);
    };
  }, [])

  return null
}

export default function ZegoUIKitPrebuiltCallWithInvitation(props) {
  const {
    appID,
    appSign,
    userID,
    userName,
    token,
    onRequireNewToken,
    requireConfig,
    plugins,
    ringtoneConfig = {
      incomingCallFileName: 'zego_incoming.mp3',
      outgoingCallFileName: 'zego_outgoing.mp3',
    },
    innerText = {},
    showDeclineButton = true,
    notifyWhenAppRunningInBackgroundOrQuit = true,
    isIOSDevelopmentEnvironment = true,
    androidNotificationConfig = {
      channelID: "CallInvitation",
      channelName: "CallInvitation",
    },

    onIncomingCallDeclineButtonPressed,
    onIncomingCallAcceptButtonPressed,
    onOutgoingCallCancelButtonPressed,
    onIncomingCallReceived,
    onIncomingCallCanceled,
    onOutgoingCallAccepted,
    onOutgoingCallRejected,
    onOutgoingCallDeclined,
    onIncomingCallTimeout,
    onOutgoingCallTimeout
  } = props;

  const [isInit, setIsInit] = useState(false);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      ZegoPrebuiltPlugins.reconnectIfDisconnected();

      notifee.cancelAllNotifications();
    }
  };

  useEffect(() => {
    notifee.cancelAllNotifications();

    notifee.createChannel({
      id: androidNotificationConfig.channelID,
      name: androidNotificationConfig.channelName,
      badge: false,
      vibration: false,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: ringtoneConfig.incomingCallFileName.split('.')[0]
    });
  }, [])

  useEffect(() => {
    // Init inner text helper
    InnerTextHelper.instance().init(innerText);

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
      <NavigationContainer initialRouteName='ZegoInnerChildrenPage'>
        {isInit ? <ZegoCallInvitationDialog
          showDeclineButton={showDeclineButton}
          onIncomingCallDeclineButtonPressed={onIncomingCallDeclineButtonPressed}
          onIncomingCallAcceptButtonPressed={onIncomingCallAcceptButtonPressed}
        /> : <View />}
        {isInit ? <CallEventListener
          notifyWhenAppRunningInBackgroundOrQuit={notifyWhenAppRunningInBackgroundOrQuit}
          isIOSDevelopmentEnvironment={isIOSDevelopmentEnvironment}
          onIncomingCallReceived={onIncomingCallReceived}
          onIncomingCallCanceled={onIncomingCallCanceled}
          onOutgoingCallAccepted={onOutgoingCallAccepted}
          onOutgoingCallRejected={onOutgoingCallRejected}
          onOutgoingCallDeclined={onOutgoingCallDeclined}
          onIncomingCallTimeout={onIncomingCallTimeout}
          onOutgoingCallTimeout={onOutgoingCallTimeout}

          androidNotificationChannelID={androidNotificationConfig.channelID}
        /> : null}
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            headerMode="none"
            name='ZegoInnerChildrenPage'
            children={() => props.children}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name='ZegoCallInvitationWaitingPage'
            component={ZegoCallInvitationWaiting}
            initialParams={{
              appID,
              appSign,
              userID,
              userName,
              token,
              onRequireNewToken,
              onOutgoingCallCancelButtonPressed
            }}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name='ZegoCallInvitationRoomPage'
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
