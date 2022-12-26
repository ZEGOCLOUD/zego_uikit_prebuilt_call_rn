import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import ZegoPrebuiltPlugins from './services/plugins';
import ZegoCallInvitationDialog from './components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './pages/ZegoCallInvitationWaiting';
import ZegoCallInvitationRoom from './pages/ZegoCallInvitationRoom';
import CallInviteStateManage from '../call_invitation/services/inviteStateManager';
import BellManage from '../call_invitation/services/bell';
import InnerTextHelper from './services/inner_text_helper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ZegoUIKit from '@zegocloud/zego-uikit-rn'
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

notifee.createChannel({
  id: 'zego_uikit_prebuilt_callinvite',
  name: 'Call Invite',
  badge: false,
  vibration: false,
  importance: AndroidImportance.HIGH,
  visibility: AndroidVisibility.PUBLIC,
});

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
    innerText = {},
    showDeclineButton = true,
    notifyWhenAppRunningInBackgroundOrQuit = true,

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
  } = config

  const [isInit, setIsInit] = useState(false);

  const handleAppStateChange = (nextAppState) => {
    if (isInit) {
      if (nextAppState === 'active') {
        ZegoPrebuiltPlugins.reconnectIfDisconnected();
      }
    }
  };

  const showBackgroundNotification = async (inviterName, type, data) => {
    const count = data.invitees ? data.invitees.length : 0;

    if (AppState.currentState != "background") {
      return;
    }
    notifee.displayNotification({
      title: InnerTextHelper.instance().getIncomingCallDialogTitle(inviterName, type, count),
      body: InnerTextHelper.instance().getIncomingCallDialogMessage(type, count),
      data: {},
      android: {
        channelId: 'callinvite',
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

  const _registerCallback = (callbackID) => {
    ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, ({ callID, invitees, data }) => {
      if (typeof onOutgoingCallTimeout == 'function') {
        onOutgoingCallTimeout(callID, invitees)
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({ callID, invitee, data }) => {
      const jsonData = data ? JSON.parse(data) : undefined;
      if (jsonData && jsonData.reason == 'busy') {
        if (typeof onOutgoingCallRejected == 'function') {
          onOutgoingCallRejected(callID, invitee)
        }
      } else {
        if (typeof onOutgoingCallDeclined == 'function') {
          onOutgoingCallDeclined(callID, invitee)
        }
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ callID, invitee, data }) => {
      if (typeof onOutgoingCallAccepted == 'function') {
        onOutgoingCallAccepted(callID, invitee)
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(callbackID, ({ callID, type, inviter, data }) => {
      if (typeof onIncomingCallReceived == 'function') {
        onIncomingCallReceived(callID, { userID: inviter.id, userName: inviter.name }, type, data.invitees)

        // Listen and show notification on background
        showBackgroundNotification(inviter.name, type, data)
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, ({ callID, inviter, data }) => {
      if (typeof onIncomingCallCanceled == 'function') {
        onIncomingCallCanceled(callID, { userID: inviter.id, userName: inviter.name })
      }
    }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(callbackID, ({ callID, inviter, data }) => {
      if (typeof onIncomingCallTimeout == 'function') {
        onIncomingCallTimeout(callID, { userID: inviter.id, userName: inviter.name })
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

    // Enable offline notification
    ZegoUIKit.getSignalingPlugin().enableNotifyWhenAppRunningInBackgroundOrQuit(notifyWhenAppRunningInBackgroundOrQuit);


    const callbackID = 'ZegoUIKitPrebuiltCallWithInvitation ' + String(Math.floor(Math.random() * 10000));
    _registerCallback(callbackID);

    return () => {
      _unregisterCallback(callbackID);

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
        {isInit ? <ZegoCallInvitationDialog
          showDeclineButton={showDeclineButton}
          onIncomingCallDeclineButtonPressed={onIncomingCallDeclineButtonPressed}
          onIncomingCallAcceptButtonPressed={onIncomingCallAcceptButtonPressed}
        /> : <View />}
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            headerMode="none"
            name="UserPage"
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
