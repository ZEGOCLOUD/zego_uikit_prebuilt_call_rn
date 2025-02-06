import CallInviteStateManage from './invite_state_manager';
import BellManage from './bell';
import { zloginfo } from '../../utils/logger';

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
        zloginfo('[CallInviteHelper][setOfflineData]', data)
        this._offlineData = data
    }
    getOfflineData() {
        return this._offlineData
    }
    acceptCall(callID, data) {
        zloginfo(`[CallInviteHelper][acceptCall] callID: ${callID}, data: ${JSON.stringify(data)}`)
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