import { zloginfo } from "../../utils/logger"

export type CallNotifyEvent = 'onIncomingCallDeclineButtonPressed'
    | 'onIncomingCallAcceptButtonPressed'
    | 'onIncomingCallReceived'
    | 'onIncomingCallCanceled'
    | 'onIncomingCallTimeout'
    | 'onOutgoingCallCancelButtonPressed'
    | 'onOutgoingCallAccepted'
    | 'onOutgoingCallRejectedCauseBusy'
    | 'onOutgoingCallDeclined'
    | 'onOutgoingCallTimeout';

export default class CallEventNotifyApp {
    private static _instance: CallEventNotifyApp;
    static getInstance() {
        return this._instance || (this._instance = new CallEventNotifyApp());
    }

    // @ts-ignore
    private eventCallbacks: Record<CallNotifyEvent, Function> = {}

    init(callbacks: any) {
        this.eventCallbacks['onIncomingCallDeclineButtonPressed'] = callbacks.onIncomingCallDeclineButtonPressed
        this.eventCallbacks['onIncomingCallAcceptButtonPressed'] = callbacks.onIncomingCallAcceptButtonPressed
        this.eventCallbacks['onIncomingCallReceived'] = callbacks.onIncomingCallReceived
        this.eventCallbacks['onIncomingCallCanceled'] = callbacks.onIncomingCallCanceled
        this.eventCallbacks['onIncomingCallTimeout'] = callbacks.onIncomingCallTimeout

        this.eventCallbacks['onOutgoingCallCancelButtonPressed'] = callbacks.onOutgoingCallCancelButtonPressed
        this.eventCallbacks['onOutgoingCallAccepted'] = callbacks.onOutgoingCallAccepted
        this.eventCallbacks['onOutgoingCallRejectedCauseBusy'] = callbacks.onOutgoingCallRejectedCauseBusy
        this.eventCallbacks['onOutgoingCallDeclined'] = callbacks.onOutgoingCallDeclined
        this.eventCallbacks['onOutgoingCallTimeout'] = callbacks.onOutgoingCallTimeout

        zloginfo(`[CallEventNotifyApp][init] succeed`)
    }

    isFunction(callback: any) {
        return typeof callback === 'function'
    }

    notifyEvent(event: CallNotifyEvent, ...params: any[]) {
        let callback = this.eventCallbacks[event]
        if (!this.isFunction(callback)) {
            zloginfo(`[CallEventNotifyApp][${event}] is not configured or the timing is too early`)
            return
        }

        zloginfo(`[CallEventNotifyApp][${event}] notify will`)
        callback(...params)
        zloginfo(`[CallEventNotifyApp][${event}] notify succeed`)
    }
}
