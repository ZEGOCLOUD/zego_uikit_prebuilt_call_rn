import { NativeModules, Platform } from 'react-native';
import { zloginfo } from '../../utils/logger';

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;

class RNCallKit {
  constructor() {
  }

  setupCallKit = (options) => {
    if (Platform.OS === 'ios') {
      return;
    }

    zloginfo('call ZegoUIKitPrebuiltCallRNModule.setupCallKit');
    ZegoUIKitPrebuiltCallRNModule.setupCallKit(options);
  }

  requestSystemAlertWindow = (message, allow, deny) => {
    if (Platform.OS === 'ios') {
      return;
    }
    ZegoUIKitPrebuiltCallRNModule.requestSystemAlertWindow(message, allow, deny);   
  };
}

export default new RNCallKit();