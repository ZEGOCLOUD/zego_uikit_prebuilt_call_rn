import {ZegoUIKitLogger} from '@zegocloud/zego-uikit-rn';
import { Platform } from "react-native";

const module = 'PrebuiltCall'

export const zloginfo = (...msg) => {
  if(ZegoUIKitLogger.logInfo) {
    ZegoUIKitLogger.logInfo(module, ...msg);
  } else {
    console.warn(`kitLogInfo is not defined in ZegoUIKit in ${Platform.OS}`);
  }
};

export const zlogwarning = (...msg) => {
if(ZegoUIKitLogger.logWarning) {
    ZegoUIKitLogger.logWarning(module, ...msg);
  } else {
    console.warn(`kitLogInfo is not defined in ZegoUIKit in ${Platform.OS}`);
  }
};

export const zlogerror = (...msg) => {
  if(ZegoUIKitLogger.logError) {
    ZegoUIKitLogger.logError(module, ...msg);
  } else {
    console.warn(`kitLogInfo is not defined in ZegoUIKit in ${Platform.OS}`);
  }
};
