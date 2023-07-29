import { Alert } from 'react-native';

export default class TimingHelper {
    _instance;
    _duration = 0;
    _onDurationUpdateCallbackMap = {};
    _durationStart = Date.now();

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new TimingHelper());
    }
    resetDuration() {
        this._duration = 0;
        this._durationStart = Date.now();
    }
    increaseDuration() {
        // The timing depends on the hardware, and on machines with poor performance, the timing may be slower than the actual
        const realDuration = Math.floor((Date.now() - this._durationStart) / 1000)
        const duration = this._duration + 1
        if (realDuration >= duration + 1) {
            this._duration = realDuration;
        } else {
            this._duration = duration;
        }
        this.notifyDurationUpdate(duration)
    }
    getDuration() {
        const realDuration = Math.floor((Date.now() - this._durationStart) / 1000)
        if (realDuration - this._duration > 2) {
            return realDuration;
        }
        return this._duration;
    }
    onDurationUpdate(callbackID, callback) {
        if (typeof callback !== 'function') {
            delete this._onDurationUpdateCallbackMap[callbackID];
        } else {
            this._onDurationUpdateCallbackMap[callbackID] = callback;
        }
    }
    async notifyDurationUpdate(duration) {
        Object.keys(this._onDurationUpdateCallbackMap).forEach((callbackID) => {
            if (this._onDurationUpdateCallbackMap[callbackID]) {
                this._onDurationUpdateCallbackMap[callbackID](duration);
            }
        });
    }
}