import { NativeEventEmitter, NativeModules } from "react-native";

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;
const Emitter = new NativeEventEmitter(ZegoUIKitPrebuiltCallRNModule);

class BackgroundTimer {
  constructor() {
    this.uniqueId = 0;
    this.callbacks = {};

    Emitter.addListener('backgroundTimer.timeout', (id) => {
      if (this.callbacks[id]) {
        const callbackById = this.callbacks[id];
        const { callback } = callbackById;
        if (!this.callbacks[id].interval) {
          delete this.callbacks[id];
        } else {
          ZegoUIKitPrebuiltCallRNModule.setTimeout(id, this.callbacks[id].timeout);
        }
        callback();
      }
    });
  }

  // New API, allowing for multiple timers
  setTimeout(callback, timeout) {
    this.uniqueId += 1;
    const timeoutId = this.uniqueId;
    this.callbacks[timeoutId] = {
      callback,
      interval: false,
      timeout,
    };
    ZegoUIKitPrebuiltCallRNModule.setTimeout(timeoutId, timeout);
    return timeoutId;
  }

  clearTimeout(timeoutId) {
    if (this.callbacks[timeoutId]) {
      delete this.callbacks[timeoutId];
    }
  }

  setInterval(callback, timeout) {
    this.uniqueId += 1;
    const intervalId = this.uniqueId;
    this.callbacks[intervalId] = {
      callback,
      interval: true,
      timeout,
    };
    ZegoUIKitPrebuiltCallRNModule.setTimeout(intervalId, timeout);
    return intervalId;
  }

  clearInterval(intervalId) {
    if (this.callbacks[intervalId]) {
      delete this.callbacks[intervalId];
    }
  }
}

export default new BackgroundTimer();