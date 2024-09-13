import ZegoUIKit from '@zegocloud/zego-uikit-rn';

export const zloginfo = (...msg) => {
  ZegoUIKit.kitLogInfo('PrebuiltCall', ...msg);
};

export const zlogwarning = (...msg) => {
  ZegoUIKit.kitLogWarning('PrebuiltCall', ...msg);
};

export const zlogerror = (...msg) => {
  ZegoUIKit.kitLogError('PrebuiltCall', ...msg);
};

export const zlogdebug = (...msg) => {
  ZegoUIKit.kitLogInfo('PrebuiltCall', ...msg);
};