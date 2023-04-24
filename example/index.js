import { AppRegistry } from 'react-native';
import App from './src/callInvitation/CallWithInvitation';
// import App from './src/call/AppNavigation';
import { name as appName } from './app.json';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import ZegoUIKitSignalingPlugin from './src/callInvitation/plugin';

ZegoUIKitPrebuiltCallService.useSystemCallingUI(ZegoUIKitSignalingPlugin);

AppRegistry.registerComponent(appName, () => App);
