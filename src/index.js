import ZegoUIKitPrebuiltCall from './call';
import ZegoUIKitPrebuiltCallWithInvitation from './call_invitation';
import ZegoCallInvitationDialog from './call_invitation/components/ZegoCallInvitationDialog';
import ZegoCallInvitationWaiting from './call_invitation/pages/ZegoCallInvitationWaiting';
import ZegoCallInvitationRoom from './call_invitation/pages/ZegoCallInvitationRoom';
import { ZegoInvitationType } from './call_invitation/services/defines';
import ZegoMenuBarButtonName from './call/ZegoMenuBarButtonName';
import ZegoMenuBarStyle from './call/ZegoMenuBarStyle';
import { ZegoLayoutMode } from '@zegocloud/zego-uikit-rn';
import ZegoSendCallInvitationButton from './call_invitation/components/ZegoSendCallInvitationButton';
import ZegoCallPrebuiltImpl from './services';

const ONE_ON_ONE_VIDEO_CALL_CONFIG = {
  turnOnCameraWhenJoining: true,
  turnOnMicrophoneWhenJoining: true,
  useSpeakerWhenJoining: true,
  layout: {
    mode: ZegoLayoutMode.pictureInPicture,
  },
  bottomMenuBarConfig: {
    buttons: [
      ZegoMenuBarButtonName.toggleCameraButton,
      ZegoMenuBarButtonName.switchCameraButton,
      ZegoMenuBarButtonName.hangUpButton,
      ZegoMenuBarButtonName.toggleMicrophoneButton,
      ZegoMenuBarButtonName.switchAudioOutputButton,
    ],
    style: ZegoMenuBarStyle.light,
  },
  topMenuBarConfig: {
    buttons: [],
    isVisible: false,
  },
  audioVideoViewConfig: {
    useVideoViewAspectFill: true,
  },
};

const ONE_ON_ONE_VOICE_CALL_CONFIG = {
  turnOnCameraWhenJoining: false,
  turnOnMicrophoneWhenJoining: true,
  useSpeakerWhenJoining: false,
  layout: {
    mode: ZegoLayoutMode.pictureInPicture,
  },
  bottomMenuBarConfig: {
    buttons: [
      ZegoMenuBarButtonName.toggleMicrophoneButton,
      ZegoMenuBarButtonName.hangUpButton,
      ZegoMenuBarButtonName.switchAudioOutputButton,
    ],
    style: ZegoMenuBarStyle.light,
  },
  topMenuBarConfig: {
    buttons: [],
    isVisible: false,
  },
  audioVideoViewConfig: {
    useVideoViewAspectFill: true,
  },
};

const GROUP_VIDEO_CALL_CONFIG = {
  turnOnCameraWhenJoining: true,
  turnOnMicrophoneWhenJoining: true,
  useSpeakerWhenJoining: true,
  layout: {
    mode: ZegoLayoutMode.gallery,
  },
  bottomMenuBarConfig: {
    buttons: [
      ZegoMenuBarButtonName.toggleCameraButton,
      ZegoMenuBarButtonName.switchCameraButton,
      ZegoMenuBarButtonName.hangUpButton,
      ZegoMenuBarButtonName.toggleMicrophoneButton,
      ZegoMenuBarButtonName.switchAudioOutputButton,
    ],
  },
  topMenuBarConfig: {
    buttons: [ZegoMenuBarButtonName.showMemberListButton],
  },
};

const GROUP_VOICE_CALL_CONFIG = {
  turnOnCameraWhenJoining: false,
  turnOnMicrophoneWhenJoining: true,
  useSpeakerWhenJoining: true,
  layout: {
    mode: ZegoLayoutMode.gallery,
  },
  bottomMenuBarConfig: {
    buttons: [
      ZegoMenuBarButtonName.toggleMicrophoneButton,
      ZegoMenuBarButtonName.hangUpButton,
      ZegoMenuBarButtonName.switchAudioOutputButton,
    ],
  },
  topMenuBarConfig: {
    buttons: [ZegoMenuBarButtonName.showMemberListButton],
  },
  memberListConfig: {
    showCameraState: false,
  },
};

export default ZegoCallPrebuiltImpl.getInstance();

export {
  ZegoUIKitPrebuiltCall,
  ZegoSendCallInvitationButton,
  ZegoUIKitPrebuiltCallWithInvitation,
  ZegoCallInvitationDialog,
  ZegoCallInvitationWaiting,
  ZegoCallInvitationRoom,
  ZegoMenuBarButtonName,
  ZegoMenuBarStyle,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
  ZegoInvitationType,
};
