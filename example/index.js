import { AppRegistry } from 'react-native';
import App from './src/callInvitation/CallWithInvitation';
import { name as appName } from './app.json';
import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZegoUIKitSignalingPlugin from './src/callInvitation/plugin';

ZegoUIKitPrebuiltCallService.useSystemCallingUI(ZegoUIKitSignalingPlugin);

AppRegistry.registerComponent(appName, () => App);
