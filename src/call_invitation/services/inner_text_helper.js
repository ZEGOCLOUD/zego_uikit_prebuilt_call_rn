
import { ZegoInvitationType } from "./defines";

export default class InnerTextHelper {
    static _innerTextHelper = null;
    _innerText = {}

    static instance() {
        if (InnerTextHelper._innerTextHelper == null) {
            InnerTextHelper._innerTextHelper = new InnerTextHelper()
            this._innerTextHelper.init({})
        }
        return this._innerTextHelper;
    }

    init(innerText) {
        const {
            incomingVideoCallDialogTitle = "%0",
            incomingVideoCallDialogMessage = "Incoming video call...",
            incomingVoiceCallDialogTitle = "%0",
            incomingVoiceCallDialogMessage = "Incoming voice call...",
            incomingGroupVideoCallDialogTitle = "%0",
            incomingGroupVideoCallDialogMessage = "Incoming group video call...",
            incomingGroupVoiceCallDialogTitle = "%0",
            incomingGroupVoiceCallDialogMessage = "Incoming group voice call...",

            incomingVideoCallPageTitle = "%0",
            incomingVideoCallPageMessage = "Incoming video call...",
            incomingVoiceCallPageTitle = "%0",
            incomingVoiceCallPageMessage = "Incoming voice call...",
            incomingGroupVideoCallPageTitle = "%0",
            incomingGroupVideoCallPageMessage = "Incoming group video call...",
            incomingGroupVoiceCallPageTitle = "%0",
            incomingGroupVoiceCallPageMessage = "Incoming group voice call...",

            outgoingVideoCallPageTitle = "%0",
            outgoingVideoCallPageMessage = "Calling...",
            outgoingVoiceCallPageTitle = "%0",
            outgoingVoiceCallPageMessage = "Calling...",

            incomingCallPageDeclineButton = "Decline",
            incomingCallPageAcceptButton = "Accept"
        } = innerText;

        this._innerText = {
            incomingVideoCallDialogTitle,
            incomingVideoCallDialogMessage,
            incomingVoiceCallDialogTitle,
            incomingVoiceCallDialogMessage,
            incomingVideoCallPageTitle,
            incomingVideoCallPageMessage,
            incomingVoiceCallPageTitle,
            incomingVoiceCallPageMessage,
            incomingGroupVideoCallDialogTitle,
            incomingGroupVideoCallDialogMessage,
            incomingGroupVoiceCallDialogTitle,
            incomingGroupVoiceCallDialogMessage,
            incomingGroupVideoCallPageTitle,
            incomingGroupVideoCallPageMessage,
            incomingGroupVoiceCallPageTitle,
            incomingGroupVoiceCallPageMessage,
            outgoingVideoCallPageTitle,
            outgoingVideoCallPageMessage,
            outgoingVoiceCallPageTitle,
            outgoingVoiceCallPageMessage,
            incomingCallPageDeclineButton,
            incomingCallPageAcceptButton,
        }
    }
    uninit() {
        this._innerText = {}
    }
    getInnerText() {
        return this._innerText;
    }
    getOutgoingCallPageTitle(inviteeName, type) {
        return inviteeName
        var title = "%0"

        title = type == ZegoInvitationType.videoCall ? this._innerText.outgoingVideoCallPageTitle : this._innerText.outgoingVoiceCallPageTitle;

        return title.replace("%0", inviteeName)
    }
    getOutgoingCallPageMessage(type) {
        return type == ZegoInvitationType.videoCall ? this._innerText.outgoingVideoCallPageMessage : this._innerText.outgoingVoiceCallPageMessage;
    }
    getIncomingCallPageTitle(inviterName, type, count) {
        var title = "%0";

        if (type == ZegoInvitationType.videoCall) {
            title = count > 1 ? this._innerText.incomingGroupVideoCallPageTitle : this._innerText.incomingVideoCallPageTitle;
        } else {
            title = count > 1 ? this._innerText.incomingGroupVoiceCallPageTitle : this._innerText.incomingVoiceCallPageTitle;
        }

        return title.replace("%0", inviterName)
    }
    getIncomingCallPageMessage(type, count) {
        var message = "";

        if (type == ZegoInvitationType.videoCall) {
            message = count > 1 ? this._innerText.incomingGroupVideoCallPageMessage : this._innerText.incomingVideoCallPageMessage
        } else {
            message = count > 1 ? this._innerText.incomingGroupVoiceCallPageMessage : this._innerText.incomingVoiceCallPageMessage
        }
        return message;
    }
    getIncomingCallDialogTitle(inviterName, type, count) {
        var title = "%0";

        if (type == ZegoInvitationType.videoCall) {
            title = count > 1 ? this._innerText.incomingGroupVideoCallDialogTitle : this._innerText.incomingVideoCallDialogTitle;
        } else {
            title = count > 1 ? this._innerText.incomingGroupVoiceCallDialogTitle : this._innerText.incomingVoiceCallDialogTitle;
        }

        return title.replace("%0", inviterName)
    }
    getIncomingCallDialogMessage(type, count) {
        var message = "";

        if (type == ZegoInvitationType.videoCall) {
            message = count > 1 ? this._innerText.incomingGroupVideoCallDialogMessage : this._innerText.incomingVideoCallDialogMessage
        } else {
            message = count > 1 ? this._innerText.incomingGroupVoiceCallDialogMessage : this._innerText.incomingVoiceCallDialogMessage;
        }
        return message;
    }
}