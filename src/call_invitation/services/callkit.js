import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(ZegoUIKitPrebuiltCallRNModule);

const answerCall = handler =>
  eventEmitter.addListener('RNCallKitPerformAnswerCallAction', (data) => handler(data));
const endCall = handler =>
  eventEmitter.addListener('RNCallKitPerformEndCallAction', (data) => handler(data));

export const listeners = {
  answerCall,
  endCall,
};

class EventListener {
  constructor(type, listener, callkit) {
    this._type = type;
    this._listener = listener;
    this._callkit = callkit;
  }

  remove = () => {
    this._callkit.removeEventListener(this._type, this._listener);
  };
}

class RNCallKit {
  constructor() {
    this._callkitEventHandlers = new Map();
  }

  addEventListener = (type, handler) => {
    const listener = listeners[type](handler);

    const listenerSet = this._callkitEventHandlers.get(type) ?? new Set();
    listenerSet.add(listener);

    this._callkitEventHandlers.set(type, listenerSet);

    return new EventListener(type, listener, this);
  };

  removeEventListener = (type, listener = undefined) => {
    const listenerSet = this._callkitEventHandlers.get(type);
    if (!listenerSet) {
      return;
    }

    if (listener) {
      listenerSet.delete(listener);
      listener.remove();
      if (listenerSet.size <= 0) {
        this._callkitEventHandlers.delete(type);
      }
    } else {
      listenerSet.forEach((listener) => {
        listener.remove();
      });
      this._callkitEventHandlers.delete(type);
    }
  };

  setupCallKit = (options) => {
    if (Platform.OS === 'ios') {
      return;
    }
    ZegoUIKitPrebuiltCallRNModule.setupCallKit(options);
  }

  displayIncomingCall = (title, message) => {
    if (Platform.OS === 'ios') {
      return;
    }
    ZegoUIKitPrebuiltCallRNModule.displayIncomingCall(title, message);
  };

  endCall = () => {
    if (Platform.OS === 'ios') {
      return;
    }
    ZegoUIKitPrebuiltCallRNModule.endCall();
  };

  requestSystemAlertWindow = (message, allow, deny) => {
    if (Platform.OS === 'ios') {
      return;
    }
    ZegoUIKitPrebuiltCallRNModule.requestSystemAlertWindow(message, allow, deny);   
  };

  getApiLevelSync = () => {
    if (Platform.OS === 'ios') {
      return 0;
    }
    return ZegoUIKitPrebuiltCallRNModule.getApiLevelSync();
  }
}

export default new RNCallKit();