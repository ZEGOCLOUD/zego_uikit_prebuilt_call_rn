import { Platform } from 'react-native';
import { zloginfo } from '../utils/logger';

export default class TimingHelper {
    static _instance;
    
    constructor() { 
        this._duration = 0;
        this._durationStart = Date.now();
        this._onDurationUpdateCallbackMap = {};
        this._timer = null;
    }
    
    static getInstance() {
        if (TimingHelper._instance) {
            return TimingHelper._instance;
        }
        TimingHelper._instance = new TimingHelper();
        return TimingHelper._instance;
    }

    startTimer() {
        zloginfo('[TimingHelper][startTimer]')
        if (!this._timer) {
            this._durationStart = Date.now();
            this._timer = setInterval(() => {
                this._increaseDuration();
            }, 1000);
        }
    }

    stopTimer() {
        zloginfo('[TimingHelper][stopTimer]')
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            this._durationStart = Date.now();
        }
    }

    resetDuration() {
        zloginfo('[TimingHelper][resetDuration]')
        this.stopTimer()

        this._duration = 0;
        this._durationStart = Date.now();
    }

    _increaseDuration() {
        if (Platform.OS === 'android') {
            // The timing depends on the hardware, and on machines with poor performance, the timing may be slower than the actual
            const realDuration = Math.floor((Date.now() - this._durationStart) / 1000)
            const duration = this._duration + 1
            if (realDuration >= duration + 1) {
                this._duration = realDuration;
            } else {
                this._duration = duration;
            }
        } else {
            this._duration = Math.floor((Date.now() - this._durationStart) / 1000)
        }

        this.notifyDurationUpdate(this._duration)
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