import { Alert } from 'react-native';

export default class TimingHelper {
    _instance;
    _duration = 0;
    _onDurationUpdateCallbackMap = {};

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new TimingHelper());
    }
    setDuration(duration) {
        this._duration = duration;
        this.notifyDurationUpdate(duration)
    }
    getDuration() {
        return this._duration;
    }
    onDurationUpdate(callbackID, callback) {
        if (typeof callback !== 'function') {
            delete this._onDurationUpdateCallbackMap[callbackID];
        } else {
            this._onDurationUpdateCallbackMap[callbackID] = callback;
        }
    }
    notifyDurationUpdate(duration) {
        Object.keys(this._onDurationUpdateCallbackMap).forEach((callbackID) => {
            if (this._onDurationUpdateCallbackMap[callbackID]) {
                this._onDurationUpdateCallbackMap[callbackID](duration);
            }
        });
    }
}