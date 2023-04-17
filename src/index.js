import ZegoUIKitPrebuiltCall from './call';
import ZegoCallInvitationDialog from './call_invitation/components/ZegoCallInvitationDialog';
import ZegoUIKitPrebuiltCallWaitingScreen from './call_invitation/pages/ZegoCallInvitationWaiting';
import ZegoUIKitPrebuiltCallInCallScreen from './call_invitation/pages/ZegoCallInvitationRoom';
import { ZegoInvitationType } from './call_invitation/services/defines';
import ZegoMenuBarButtonName from './call/ZegoMenuBarButtonName';
import ZegoMenuBarStyle from './call/ZegoMenuBarStyle';
import ZegoSendCallInvitationButton from './call_invitation/components/ZegoSendCallInvitationButton';
import ZegoUIKitPrebuiltCallService from './services';
import {
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
} from './services/defines';

export default ZegoUIKitPrebuiltCallService.getInstance();

export {
  ZegoUIKitPrebuiltCall,
  ZegoSendCallInvitationButton,
  ZegoCallInvitationDialog,
  ZegoUIKitPrebuiltCallWaitingScreen,
  ZegoUIKitPrebuiltCallInCallScreen,
  ZegoMenuBarButtonName,
  ZegoMenuBarStyle,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  ONE_ON_ONE_VOICE_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
  GROUP_VOICE_CALL_CONFIG,
  ZegoInvitationType,
};
