import {ZegoUIKitLogger} from '@zegocloud/zego-uikit-rn';

const module = 'PrebuiltCall'

export const zloginfo = (...msg) => {
  ZegoUIKitLogger.logInfo(module, ...msg);
};

export const zlogwarning = (...msg) => {
  ZegoUIKitLogger.logWarning(module, ...msg);
};

export const zlogerror = (...msg) => {
  ZegoUIKitLogger.logError(module, ...msg);
};