import { Image, View } from 'react-native';

import * as ZIM from 'zego-zim-react-native';
import * as ZPNs from 'zego-zpns-react-native';

import { ZegoLayoutMode } from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService, {
    ZegoInvitationType,
    ZegoMenuBarButtonName,
    ZegoMultiCertificate,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

import KeyCenter from '../KeyCenter';

const notificationStyle = 'CustomView';

export const onUserLogin = async (userID, userName, props) => {
    return ZegoUIKitPrebuiltCallService.init(
      KeyCenter.appID,
      KeyCenter.appSign,
      userID,
      userName,
      [ZIM, ZPNs],
      {
        ringtoneConfig: {
          incomingCallFileName: 'zego_incoming.mp3',
          outgoingCallFileName: 'zego_outgoing.mp3',
        },
        // notifyWhenAppRunningInBackgroundOrQuit: true,
        androidNotificationConfig: {
          channelID: "ZegoUIKit",
          channelName: "ZegoUIKit",
        },
        certificateIndex: ZegoMultiCertificate.first,
        avatarBuilder: ({userInfo}) => {
          return <View style={{width: '100%', height: '100%'}}>
           <Image 
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            source={{ uri: `https://robohash.org/${userInfo.userID}.png` }}
            />
          </View>
        },
        waitingPageConfig: {
          
        },
        requireInviterConfig: {
          enabled: false,
          detectSeconds: 5,
        },
        showDeclineButton: true,
        innerText: {
  
        },
        onIncomingCallDeclineButtonPressed: (navigation) => {
          console.log('[onIncomingCallDeclineButtonPressed]');
        },
        onIncomingCallAcceptButtonPressed: (navigation) => {
          console.log('[onIncomingCallAcceptButtonPressed]');
        },
        onIncomingCallReceived: (callID, inviter, type, invitees, customData) => {
          console.log('[onIncomingCallReceived]+++', callID, inviter, type, invitees, customData)
        },
        onIncomingCallCanceled: (callID, inviter) => {
          console.log('[onIncomingCallCanceled]+++', callID, inviter);
        },
        onIncomingCallTimeout: (callID, inviter) => {
          console.log('[onIncomingCallTimeout]+++', callID, inviter);
        },
        onOutgoingCallCancelButtonPressed: (navigation, callID, invitees, type) => {
          console.log('[onOutgoingCallCancelButtonPressed]+++', callID, invitees, type);
        },
        onOutgoingCallAccepted: (callID, invitee) => {
          console.log('[onOutgoingCallAccepted]+++', callID, invitee);
        },
        onOutgoingCallRejectedCauseBusy: (callID, invitee) => {
          console.log('[onOutgoingCallRejectedCauseBusy]+++', callID, invitee);
        },
        onOutgoingCallDeclined: (callID, invitee) => {
          console.log('[onOutgoingCallDeclined]+++', callID, invitee);
        },
        onOutgoingCallTimeout: (callID, invitees) => {
          console.log('[onOutgoingCallTimeout]+++', callID, invitees);
        },
        requireConfig: (callInvitationData) => {
          console.log('requireConfig, callID: ', callInvitationData.callID);
          return {
            turnOnMicrophoneWhenJoining: true,
            turnOnCameraWhenJoining: (callInvitationData.type === ZegoInvitationType.videoCall) ? true : false,
            layout: {
              mode: (callInvitationData.invitees && callInvitationData.invitees.length > 1) ? ZegoLayoutMode.gallery : ZegoLayoutMode.pictureInPicture,
              config: {
                removeViewWhenAudioVideoUnavailable: false
              }
            },
            // foregroundBuilder: () => <ZegoCountdownLabel maxDuration={10} onCountdownFinished={() => { console.log("Countdown finished!!"); ZegoUIKitPrebuiltCallService.hangUp(true); }} />,
            onCallEnd: (callID, reason, duration) => {
              console.log('########CallWithInvitation onCallEnd', callID, reason, duration);
              if (typeof props.navigation.popTo === 'function') {
                props.navigation.popTo('HomeScreen');
              } else {
                props.navigation.navigate('HomeScreen');
              }
            },
            timingConfig: {
              isDurationVisible: true,
              onDurationUpdate: (duration) => {
                console.log('########CallWithInvitation onDurationUpdate', userID, duration);
                if (duration === 10 * 60) {
                  ZegoUIKitPrebuiltCallService.hangUp();
                }
              }
            },
            topMenuBarConfig: {
              buttons: [
                ZegoMenuBarButtonName.minimizingButton,
                // ZegoMenuBarButtonName.showMemberListButton
              ],
            },
            onWindowMinimized: () => {
              console.log('[Demo]CallInvitation onWindowMinimized');
              if (typeof props.navigation.popTo === 'function') {
                props.navigation.popTo('HomeScreen');
              } else {
                props.navigation.navigate('HomeScreen');
              }
            },
            onWindowMaximized: () => {
              console.log('[Demo]CallInvitation onWindowMaximized');
              props.navigation.navigate('ZegoUIKitPrebuiltCallInCallScreen');
            },
          }
        }
      }
    ).then(() => {
      if (notificationStyle === 'CallStyle') {
        ZegoUIKitPrebuiltCallService.requestSystemAlertWindow({
          message: 'We need your consent for the following permissions in order to use the offline call function properly',
          allow: 'Allow',
          deny: 'Deny',
        });
      }
    });
}