import ZegoUIKit from '@zegocloud/zego-uikit-rn';
import ZegoPrebuiltPlugins from './plugins';
import { zloginfo, zlogwarning, zlogerror } from '../../utils/logger';

// completed: Someone ran out of time, accepted or declined an invitation
// uncompleted: Others did not accept or reject the invitation, and the invitation did not time out

// Consider having multiple call invitation processes at the same time

const InviteState = {
  uncompleted: 1, // inviter: send an invitation、init state
  completed: 2, // inviter: send an invitation
  pending: 3, // invitee: call pending、init state
  accepted: 4, // invitee: accept
  missed: 5, // invitee: timout
  rejected: 6, // invitee: rejection
};

const CallInviteStateManage = {
  _callbackID: '',
  _invitationMap: new Map(), // callID -> state detail
  _onInviteCompletedWithNobodyMap: new Map(),
  _onSomeoneAcceptedInviteMap: new Map(),
  _notifyInviteCompletedWithNobody: (callID) => {
    const stateDetails = CallInviteStateManage._invitationMap.get(callID);
    if (stateDetails) {
      zlogwarning(
        '######_notifyInviteCompletedWithNobody######',
        callID,
        CallInviteStateManage._invitationMap
      );
      const completedWithNobody =
        stateDetails.inviteState === InviteState.completed &&
        !Array.from(stateDetails.invitees.values()).find(
          (inviteState) => inviteState === InviteState.accepted
        );
      if (completedWithNobody) {
        // notify
        Array.from(
          CallInviteStateManage._onInviteCompletedWithNobodyMap.values()
        ).forEach((callback) => {
          callback && callback(callID);
        });
      }
    }
  },
  _judgeInviteCompleted: (callID) => {
    const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
    return !Array.from(inviteDetails.invitees.values()).find(
      (inviteState) => inviteState === InviteState.pending
    );
  },
  init: () => {
    CallInviteStateManage.registerCallback();
  },
  uninit: () => {
    CallInviteStateManage.unRegisterCallback();
    CallInviteStateManage._invitationMap.clear();
    CallInviteStateManage._onInviteCompletedWithNobodyMap.clear();
    CallInviteStateManage._onSomeoneAcceptedInviteMap.clear();
  },
  registerCallback: () => {
    zloginfo('[CallInviteStateManage]registerCallback success');
    CallInviteStateManage._callbackID =
      'CallInviteStateManage' + String(Math.floor(Math.random() * 10000));
    ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(
      CallInviteStateManage._callbackID,
      ({ callID, invitees, data }) => {
        // update _invitationMap
        const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
        if (inviteDetails) {
          invitees.forEach((invitee) => {
            inviteDetails.invitees.set(invitee.id, InviteState.missed);
          });
          inviteDetails.inviteState =
            CallInviteStateManage._judgeInviteCompleted(callID)
              ? InviteState.completed
              : InviteState.uncompleted;
          CallInviteStateManage._notifyInviteCompletedWithNobody(callID);
        }
      }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationRefused(
      CallInviteStateManage._callbackID,
      ({ callID, invitee, data }) => {
        // update _invitationMap
        const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
        if (inviteDetails) {
          inviteDetails.invitees.set(invitee.id, InviteState.rejected);
          inviteDetails.inviteState =
            CallInviteStateManage._judgeInviteCompleted(callID)
              ? InviteState.completed
              : InviteState.uncompleted;
          CallInviteStateManage._notifyInviteCompletedWithNobody(callID);
        }
      }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(
      CallInviteStateManage._callbackID,
      ({ callID, invitee, data }) => {
        // update _invitationMap
        zloginfo(
          '######onInvitationAccepted######',
          CallInviteStateManage._invitationMap,
          callID
        );
        const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
        if (inviteDetails) {
          inviteDetails.invitees.set(invitee.id, InviteState.accepted);
          inviteDetails.inviteState =
            CallInviteStateManage._judgeInviteCompleted(callID)
              ? InviteState.completed
              : InviteState.uncompleted;
          // notify
          Array.from(
            CallInviteStateManage._onSomeoneAcceptedInviteMap.values()
          ).forEach((callback) => {
            callback && callback(callID);
          });
        }
      }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(
      CallInviteStateManage._callbackID,
      ({ callID, type, inviter, data }) => {
        zloginfo('onInvitationReceived implement by ' + TAG);

        data = JSON.parse(data);
        // update _invitationMap
        const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
        if (inviteDetails) {
          // No such case
        } else {
          CallInviteStateManage.addInviteData(
            callID,
            inviter.id,
            data.invitees.map((invitee) => invitee.user_id)
          );
        }
      },
      TAG
    );
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(
      CallInviteStateManage._callbackID,
      ({ callID, inviter, data }) => {
        // update _invitationMap
        CallInviteStateManage._invitationMap.delete(callID);
      }
    );
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(
      CallInviteStateManage._callbackID,
      ({ callID, inviter, data }) => {
        // update _invitationMap
        const inviteDetails = CallInviteStateManage._invitationMap.get(callID);
        if (inviteDetails) {
          const localUser = ZegoPrebuiltPlugins.getLocalUser();
          inviteDetails.invitees.set(localUser.userID, InviteState.missed);
        } else {
          // No such case
        }
      }
    );
  },
  unRegisterCallback: () => {
    ZegoUIKit.getSignalingPlugin().onInvitationResponseTimeout(
      CallInviteStateManage._callbackID
    );
    ZegoUIKit.getSignalingPlugin().onInvitationRefused(
      CallInviteStateManage._callbackID
    );
    ZegoUIKit.getSignalingPlugin().onInvitationAccepted(
      CallInviteStateManage._callbackID
    );
    ZegoUIKit.getSignalingPlugin().onInvitationReceived(
      CallInviteStateManage._callbackID
    );
    ZegoUIKit.getSignalingPlugin().onInvitationCanceled(
      CallInviteStateManage._callbackID
    );
    ZegoUIKit.getSignalingPlugin().onInvitationTimeout(
      CallInviteStateManage._callbackID
    );
  },
  // This call is called after the call invitation has ended or before an invitation starts
  initInviteData: () => {
    CallInviteStateManage._invitationMap.clear();
  },
  // This interface is called after the invitation is received and the invitation is successfully sent
  addInviteData: (invitationID, inviterID, invitees) => {
    const temp = new Map();
    invitees.forEach((inviteeID) => {
      temp.set(inviteeID, InviteState.pending);
    });
    CallInviteStateManage._invitationMap.set(invitationID, {
      inviterID,
      inviteState: InviteState.uncompleted,
      invitees: temp,
    });
    zloginfo('######addInviteData######', JSON.stringify(...CallInviteStateManage._invitationMap));
  },
  // This interface is called after the invitation is successfully rejected
  updateInviteDataAfterRejected: (callID) => {
    // update _invitationMap
    CallInviteStateManage._invitationMap.delete(callID);
  },
  // This interface is called after the invitation is successfully accepted
  updateInviteDataAfterAccepted: (invitationID) => {
    // update _invitationMap
    const localUser = ZegoPrebuiltPlugins.getLocalUser();
    const inviteDetails = CallInviteStateManage._invitationMap.get(invitationID);
    if (inviteDetails) {
      inviteDetails.invitees.set(localUser.userID, InviteState.accepted);
    }
  },
  // This interface is called after the invitation is successfully cancel
  updateInviteDataAfterCancel: (invitationID) => {
    // update _invitationMap
    CallInviteStateManage._invitationMap.delete(invitationID);
  },
  isInviteCompleted: (invitationID) => {
    const inviteDetails = CallInviteStateManage._invitationMap.get(invitationID);
    if (inviteDetails) {
      return inviteDetails.inviteState === InviteState.completed;
    } else {
      return false;
    }
  },
  isAutoCancelInvite: (invitationID) => {
    zloginfo(
      '######isAutoCancelInvite######',
      invitationID,
      CallInviteStateManage._invitationMap
    );
    let auto = false;
    if (!CallInviteStateManage.isInviteCompleted(invitationID)) {
      const inviteDetails = CallInviteStateManage._invitationMap.get(invitationID);
      if (inviteDetails) {
        const temp = Array.from(inviteDetails.invitees.values());
        if (
          !temp.find(
            (inviteState) =>
              inviteState === InviteState.accepted ||
              inviteState === InviteState.rejected
          )
        ) {
          // Scene1: When no one clicks accept or reject
          auto = true;
        } else if (
          !temp.find((inviteState) => inviteState === InviteState.accepted) &&
          temp.filter((inviteState) => inviteState === InviteState.rejected)
            .length < temp.length
        ) {
          // Scene2: No one accepts, only some people refuse
          auto = true;
        }
      }
    }
    return auto;
  },
  // Determine whether a call is being made
  isOncall: (
    newCallID,
    inviteeID = ZegoPrebuiltPlugins.getLocalUser().userID
  ) => {
    zloginfo('######isOncall######', JSON.stringify(...CallInviteStateManage._invitationMap));
    let isOn = false;
    const callIDs = Array.from(CallInviteStateManage._invitationMap.keys());
    for (let index = 0, len = callIDs.length; index < len; index++) {
      const currentCallID = callIDs[index];
      if (currentCallID !== newCallID) {
        const stateDetails =
          CallInviteStateManage._invitationMap.get(currentCallID);
        if (stateDetails) {
          const inviteState = stateDetails.invitees.get(inviteeID);
          if (
            inviteState === InviteState.pending ||
            inviteState === InviteState.accepted
          ) {
            isOn = true;
            break;
          }
        }
      }
    }
    return isOn;
  },

  // query call list, and delete ended call data
  deleteEndedCall: () => {
    if (CallInviteStateManage._invitationMap.size == 0) {
        zloginfo('no call data');
        return;
    }
    return new Promise((resolve, reject) => {
        ZegoUIKit.getSignalingPlugin().queryCallList(5)
        .then((data) => {
            zloginfo(`queryCallList, nextFlag: ${data.nextFlag}, count: ${data.callList.length}`);
            for (const info of data.callList) {
                if (info.state === 1) {
                    continue;
                }
                zloginfo(`call info:`, info.callID, info.caller, info.state, info.extendedData);
                CallInviteStateManage._invitationMap.delete(info.callID);
            }
            resolve();
        })
        .catch((error) => {
            zloginfo(`queryCallList error: ${error}`);
            reject(error);
        });
    });
  },

  onSomeoneAcceptedInvite: (callbackID, callback) => {
    if (typeof callback !== 'function') {
      if (CallInviteStateManage._onSomeoneAcceptedInviteMap.has(callbackID)) {
        CallInviteStateManage._onSomeoneAcceptedInviteMap.delete(callbackID);
      }
    } else {
      CallInviteStateManage._onSomeoneAcceptedInviteMap.set(
        callbackID,
        callback
      );
    }
  },
  onInviteCompletedWithNobody: (callbackID, callback) => {
    if (typeof callback !== 'function') {
      if (CallInviteStateManage._onInviteCompletedWithNobodyMap.has(callbackID)) {
        CallInviteStateManage._onInviteCompletedWithNobodyMap.delete(
          callbackID
        );
      }
    } else {
      CallInviteStateManage._onInviteCompletedWithNobodyMap.set(
        callbackID,
        callback
      );
    }
  },
};

export default CallInviteStateManage;
const TAG = 'invite_state_manager';