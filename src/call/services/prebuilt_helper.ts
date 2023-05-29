export default class PrebuiltHelper {
    static _instance: PrebuiltHelper;
    _stateData: { [index: string]: any } = {
    };
    _routeParams: { [index: string]: any } = {};
    _notifyData: { [index: string]: any }  = {};
    _onPrebuiltDestroyCallbackMap: { [index: string]: (data?: any) => void } = {};
    constructor() { }
    static getInstance() {
        return this._instance || (this._instance = new PrebuiltHelper());
    }
    // Use reference types directly, so the set method is not provided here
    getStateData() {
        return this._stateData;
    }
    getRouteParams() {
        return this._routeParams;
    }
    getNotifyData() {
        return this._notifyData;
    }
    clearState() {
        this._stateData = {
            memberConnectStateMap: {},
        };
    }
    clearRouteParams() {
        this._routeParams = {};
    }
    clearNotify() {
        this._notifyData = {};
    }
    notifyDestroyPrebuilt() {
        Object.keys(this._onPrebuiltDestroyCallbackMap).forEach((callbackID) => {
            if (this._onPrebuiltDestroyCallbackMap[callbackID]) {
                this._onPrebuiltDestroyCallbackMap[callbackID]();
            }
        })
    }
    // Temporarily resolved an issue where dialog shutdown could not be triggered
    onPrebuiltDestroy(callbackID: string, callback?: (data: any) => void) {
        if (typeof callback !== 'function') {
            delete this._onPrebuiltDestroyCallbackMap[callbackID];
        } else {
            this._onPrebuiltDestroyCallbackMap[callbackID] = callback;
        }
    }
}