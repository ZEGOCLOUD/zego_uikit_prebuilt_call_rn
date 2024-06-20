import { ZegoLayoutMode } from '@zegocloud/zego-uikit-rn';
import ZegoMenuBarButtonName from '../call/ZegoMenuBarButtonName';
import ZegoMenuBarStyle from '../call/ZegoMenuBarStyle';

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

const ZegoMultiCertificate = {
  first: 1,
  second: 2,
};

const ZegoCallEndReason = {
  /// the call ended due to a local hang-up
  localHangUp: 0,

  /// the call ended when the remote user hung up, leaving only one local user in the call
  remoteHangUp: 1,

  /// the call ended due to being kicked out
  kickOut: 2,
}

export {
    ONE_ON_ONE_VIDEO_CALL_CONFIG,
    ONE_ON_ONE_VOICE_CALL_CONFIG,
    GROUP_VIDEO_CALL_CONFIG,
    GROUP_VOICE_CALL_CONFIG,
    ZegoMenuBarButtonName,
    ZegoMultiCertificate,
    ZegoCallEndReason,
}