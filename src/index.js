import ZegoUIKitPrebuiltCall from './call'
import ZegoMenuBarButtonName from './call/ZegoMenuBarButtonName';
import ZegoMenuBarStyle from './call/ZegoMenuBarStyle';
import { ZegoLayoutMode } from '@zegocloud/zego-uikit-rn'

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
            ZegoMenuBarButtonName.switchAudioOutputButton
        ],
        style: ZegoMenuBarStyle.light
    },
    topMenuBarConfig: {
        buttons: [],
        isVisible: false
    },
    audioVideoViewConfig: {
        useVideoViewAspectFill: true
    }
}

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
            ZegoMenuBarButtonName.switchAudioOutputButton
        ],
        style: ZegoMenuBarStyle.light
    },
    topMenuBarConfig: {
        buttons: [],
        isVisible: false
    },
    audioVideoViewConfig: {
        useVideoViewAspectFill: true
    }
}

export default ZegoUIKitPrebuiltCall;

export {
    ONE_ON_ONE_VIDEO_CALL_CONFIG,
    ONE_ON_ONE_VOICE_CALL_CONFIG
}


