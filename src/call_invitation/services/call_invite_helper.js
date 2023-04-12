import CallInviteStateManage from './invite_state_manager';
import BellManage from './bell';

export default class CallInviteHelper {
    _currentCallUUID;
    _instance;
    _offlineData;
    onAcceptCallbackMap = {};
    onRefuseCallbackMap = {};

    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new CallInviteHelper());
    }

    setOfflineData(data) {
        this._offlineData = data
    }
    getOfflineData() {
        return this._offlineData
    }
    setCurrentCallUUID(callUUID) {
        this._currentCallUUID = callUUID;
    }
    getCurrentCallUUID() {
        return this._currentCallUUID;
    }
    acceptCall(callID, data) {
        CallInviteStateManage.updateInviteDataAfterAccepted(callID);
        BellManage.stopIncomingSound();
        BellManage.cancleVirate();
        this.notifyAccept(data);
    }

    refuseCall(callID) {
        CallInviteStateManage.updateInviteDataAfterRejected(callID);
        BellManage.stopIncomingSound();
        BellManage.cancleVirate();
        this.notifyRefuse();
    }

    notifyAccept(data) {
        Object.keys(this.onAcceptCallbackMap).forEach((callbackID) => {
            if (this.onAcceptCallbackMap[callbackID]) {
                this.onAcceptCallbackMap[callbackID](data);
            }
        })
    }
    onCallAccepted(callbackID, callback) {
        if (typeof callback !== 'function') {
            delete this.onAcceptCallbackMap[callbackID];
        } else {
            this.onAcceptCallbackMap[callbackID] = callback;
        }
    }

    notifyRefuse() {
        Object.keys(this.onRefuseCallbackMap).forEach((callbackID) => {
            if (this.onRefuseCallbackMap[callbackID]) {
                this.onRefuseCallbackMap[callbackID]();
            }
        })
    }
    onCallRefused(callbackID, callback) {
        if (typeof callback !== 'function') {
            delete this.onRefuseCallbackMap[callbackID];
        } else {
            this.onRefuseCallbackMap[callbackID] = callback;
        }
    }
}