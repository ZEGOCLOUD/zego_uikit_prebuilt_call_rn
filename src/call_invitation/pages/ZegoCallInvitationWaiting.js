import React, { useEffect } from 'react';
import { StyleSheet, View, Platform, PermissionsAndroid, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ZegoUIKit, {
  ZegoAudioVideoView,
  ZegoSwitchCameraButton,
} from '@zegocloud/zego-uikit-rn';

import ZegoUIKitPrebuiltCallService from '../../services';
import { zloginfo, zlogwarning } from '../../utils/logger';
import BellManage from '../services/bell';
import CallEventNotifyApp from '../services/callevent_notify_app';
import CallInviteStateManage from '../services/invite_state_manager';
import ZegoPrebuiltPlugins from '../services/plugins';
import ZegoCallInvationForeground from './ZegoCallInvationForeground';

export default function ZegoUIKitPrebuiltCallWaitingScreen(props) {
  const TAG = 'ZegoUIKitPrebuiltCallWaitingScreen';

  const navigation = useNavigation();
  const { appID, appSign } = ZegoUIKitPrebuiltCallService.getInstance().getInitAppInfo();
  const { userID, userName } = ZegoUIKitPrebuiltCallService.getInstance().getInitUser();
  const initConfig = ZegoUIKitPrebuiltCallService.getInstance().getInitConfig();
  const { avatarBuilder, waitingPageConfig } = initConfig;
  const { route } = props;
  const {
    roomID,
    isVideoCall,
    invitees,
    inviterID,
    invitationID,
    callName,
  } = route.params;

  const getInviteeIDList = () => {
    return invitees.map(invitee => {
      return invitee.userID
    });
  }
  const grantPermissions = async (callback) => {
    // Android: Dynamically obtaining device permissions
    if (Platform.OS === 'android') {
      // Check if permission granted
      let grantedAudio = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      let grantedCamera = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const ungrantedPermissions = [];
      try {
        const isAudioGranted = await grantedAudio;
        const isVideoGranted = await grantedCamera;
        if (!isAudioGranted) {
          ungrantedPermissions.push(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
        }
        if (!isVideoGranted && isVideoCall) {
          ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
      } catch (error) {
        ungrantedPermissions.push(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
      }
      // If not, request it
      zloginfo(`[ZegoUIKitPrebuiltCallWaitingScreen] requestMultiple, ungrantedPermissions: ${ungrantedPermissions}`);
      return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
        (result) => {
          zloginfo(`[ZegoUIKitPrebuiltCallWaitingScreen] requestMultiple, result: ${result}`);
          if (callback) {
            callback();
          }
        }
      );
    } else if (callback) {
      callback();
    }
  };
  const hangUpHandle = () => {
    zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] hangUpHandle, Leave room on waiting page');

    ZegoUIKit.uninit();
    CallEventNotifyApp.getInstance().notifyEvent('onOutgoingCallCancelButtonPressed', navigation, roomID, invitees, isVideoCall ? 1 : 0)
    if (CallInviteStateManage.isAutoCancelInvite(invitationID)) {
      ZegoUIKit.getSignalingPlugin().cancelInvitation(getInviteeIDList(), JSON.stringify({
        "call_id": roomID, 
        "operation_type": "cancel_invitation",
        'inviter': {userID: ZegoPrebuiltPlugins.getLocalUser().userID, userName: ZegoPrebuiltPlugins.getLocalUser().userName}
      }));
      CallInviteStateManage.updateInviteDataAfterCancel(invitationID);
    }
    BellManage.stopOutgoingSound();
    CallInviteStateManage.initInviteData();
    navigation.goBack();
  };

  useEffect(() => {
    BellManage.playOutgoingSound();
    ZegoUIKit.init(appID, appSign, { userID, userName }).then(() => {
      grantPermissions(() => {
        ZegoUIKit.turnCameraOn('', isVideoCall);
        ZegoUIKit.turnMicrophoneOn('', true);
        ZegoUIKit.setAudioOutputToSpeaker(true);
      });
    });
    const unsubscribe1 = navigation.addListener('blur', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, blur');
    })
    const unsubscribe2 = navigation.addListener('focus', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, focus');
    })
    const unsubscribe3 = navigation.addListener('beforeRemove', () => {  
      zloginfo('[Navigation] ZegoUIKitPrebuiltCallWaitingScreen, beforeRemove');
    })
    return () => {
      BellManage.stopOutgoingSound();
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBackButton = () => {
    return true;
  }

  useEffect(() => {
    zloginfo(`ZegoUIKitPrebuiltCallWaitingScreen useEffect, invitationID: ${invitationID}`);

    const callbackID =
      'ZegoUIKitPrebuiltCallWaitingScreen' + String(Math.floor(Math.random() * 10000));
    if (invitees.length === 1) {
      ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID, ({callID, invitees, data}) => {
        zloginfo(`onInvitationResponseTimeout implement by ${TAG}, callID: ${callID}, data: ${data}`);

        ZegoUIKit.uninit();
        BellManage.stopOutgoingSound();
        // ZegoUIKit.leaveRoom();
        CallInviteStateManage.initInviteData();
        navigation.goBack();

        let dataParsed = data ? JSON.parse(data) : {}
        const dataInDataParsed = dataParsed.data ? JSON.parse(dataParsed.data) : {}
        CallEventNotifyApp.getInstance().notifyEvent('onOutgoingCallTimeout',
          dataInDataParsed.call_id,
          dataParsed.invitees
        )

        zloginfo(`onInvitationResponseTimeout implement by ${TAG}, process done`);
      });
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID, ({callID, invitee, data}) => {
        zloginfo(`onInvitationRefused implement by ${TAG}, callID: ${callID}, data: ${data}`);
  
        ZegoUIKit.uninit();
        const callIDs = Array.from(CallInviteStateManage._invitationMap.keys());
        if (callIDs.includes(callID)) {
          BellManage.stopOutgoingSound();
          // ZegoUIKit.leaveRoom();
          CallInviteStateManage.initInviteData();
          navigation.goBack();
        }

        let dataParsed = data ? JSON.parse(data) : {}
        if (dataParsed.reason === 'busy') {
          CallEventNotifyApp.getInstance().notifyEvent('onOutgoingCallRejectedCauseBusy', dataParsed.call_id, dataParsed.invitee)
        } else {
          CallEventNotifyApp.getInstance().notifyEvent('onOutgoingCallDeclined', dataParsed.call_id, dataParsed.invitee)
        }
      });

      // After the caller initiates a call and then loses network connectivity, 
      // the server will cancel the call and notify both the caller and the callee that the call has been canceled.
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID, (result) => {
        zloginfo(`[ZegoUIKitPrebuiltCallWaitingScreen] onInvitationCanceled, result: ${JSON.stringify(result)}`);
        if (result.callID !== invitationID) {
          zlogwarning('[ZegoUIKitPrebuiltCallWaitingScreen] onInvitationCanceled, callID not match')
          return
        }

        ZegoUIKit.uninit();
        BellManage.stopOutgoingSound();
        CallInviteStateManage.initInviteData();
        navigation.goBack();
      });
    } else {
      // CallInviteStateManage.onSomeoneAcceptedInvite(callbackID, () => {
      //   zloginfo('Someone accepted the invitation');
      //   BellManage.stopOutgoingSound();
      // });
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID, () => {
        zloginfo('[ZegoUIKitPrebuiltCallWaitingScreen] onInviteCompletedWithNobody');

        ZegoUIKit.uninit();
        navigation.goBack();
      });
    }
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID, ({ invitee, data }) => {
      zloginfo(`onInvitationAccepted implement by ${TAG}, invitee: ${JSON.stringify(invitee)}, data: ${data}`);

      BellManage.stopOutgoingSound();

        // ZegoUIKit.leaveRoom().then(() => {
          zloginfo('Jump to call room page.');

          const state = navigation.getState();
          zloginfo(`Current navigation routes: [${state.routes.map(r => r.name).join(', ')}]`)
          
          const isAlreadyInCall = state.routes.some(r => r.name === 'ZegoUIKitPrebuiltCallInCallScreen');
          if (isAlreadyInCall) {
            zloginfo('Already in ZegoUIKitPrebuiltCallInCallScreen page, do not need to jump again.')
          } else {
            zloginfo('Navigate to ZegoUIKitPrebuiltCallInCallScreen')
            navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen', {
              origin: 'ZegoUIKitPrebuiltCallWaitingScreen',
              roomID,
              isVideoCall,
              invitees: getInviteeIDList(),
              inviter: inviterID,
              invitationID,
              useFrontFacingCamera: ZegoUIKit.isUsingFrontFacingCamera()
            });
          }
        // });

      let dataParsed = data ? JSON.parse(data) : {}
      CallEventNotifyApp.getInstance().notifyEvent('onOutgoingCallAccepted', dataParsed.call_id, dataParsed.invitee)

      zloginfo(`onInvitationAccepted implement by ${TAG}, process done`);
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    navigation.setOptions({ gestureEnabled: false });

    return () => {
      ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationRefused(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationCanceled(callbackID);
      ZegoUIKit.getSignalingPlugin().onInvitationAccepted(callbackID);
      CallInviteStateManage.onInviteCompletedWithNobody(callbackID);
      backHandler.remove()
      navigation.setOptions({ gestureEnabled: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {isVideoCall ? (
        <ZegoAudioVideoView
          userID={userID}
          roomID={roomID}
          useVideoViewAspectFill={true}
          // eslint-disable-next-line react/no-unstable-nested-components
          foregroundBuilder={() => (
            <ZegoCallInvationForeground
              isVideoCall={isVideoCall}
              invitee={invitees[0]}
              onHangUp={hangUpHandle}
              avatarBuilder={avatarBuilder}
              waitingPageConfig={waitingPageConfig}
              callName={callName}
              isGroupCall={invitees.length > 1}
            />
          )}
        />
      ) : (
        <ZegoCallInvationForeground
          isVideoCall={isVideoCall}
          invitee={invitees[0]}
          onHangUp={hangUpHandle}
          avatarBuilder={avatarBuilder}
          waitingPageConfig={waitingPageConfig}
          callName={callName}
          isGroupCall={invitees.length > 1}
        />
      )}
      {isVideoCall ? (
        <View style={styles.topMenuContainer}>
          <ZegoSwitchCameraButton iconBuilder={waitingPageConfig.switchCameraBuilder} />
        </View>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  topMenuContainer: {
    zIndex: 2,
    width: '100%',
    paddingRight: 15,
    top: 30,
    alignItems: 'flex-end',
  },
});
