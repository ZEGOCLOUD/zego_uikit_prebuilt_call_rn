import { getLocalDateFormat } from './timer';

export const zloginfo = (...msg) => {
  console.log(getLocalDateFormat() + ' ZEGOUIKit[INFO]: ', ...msg);
};

export const zlogwarning = (...msg) => {
  console.warn(getLocalDateFormat() + ' ZEGOUIKit[WARNING]: ', ...msg);
};

export const zlogerror = (...msg) => {
  console.error(getLocalDateFormat() + ' ZEGOUIKit[ERROR]: ', ...msg);
};
