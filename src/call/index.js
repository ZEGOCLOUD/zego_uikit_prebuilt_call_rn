import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { PermissionsAndroid, Alert, Text, BackHandler, TouchableOpacity } from 'react-native';
import Delegate from 'react-delegate-component';
import { StyleSheet, View } from 'react-native';
import ZegoUIKit, { ZegoAudioVideoContainer, ZegoInRoomMessageView, ZegoLayoutMode, ZegoInRoomMessageInput } from '@zegocloud/zego-uikit-rn'
import AudioVideoForegroundView from './AudioVideoForegroundView';
import ZegoBottomBar from './ZegoBottomBar';
import ZegoTopMenuBar from './ZegoTopMenuBar';
import ZegoCallMemberList from './ZegoCallMemberList';
import ZegoMenuBarButtonName from './ZegoMenuBarButtonName';
import ZegoMenuBarStyle from './ZegoMenuBarStyle';
import TimingHelper from "../services/timing_helper";
import MinimizingHelper from "./services/minimizing_helper";
import PrebuiltHelper from "./services/prebuilt_helper";
import ZegoPrebuiltForegroundView from './ZegoPrebuiltForegroundView';
import Timer from "../utils/timer"
import { useNavigation } from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake'
import { useKeyboard } from '../utils/keyboard';
import { ZegoCallEndReason } from '../services/defines';
import { zloginfo } from '../utils/logger';

function ZegoUIKitPrebuiltCall(props, ref) {
    const navigation = useNavigation();

    const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
    !isMinimizeSwitch && MinimizingHelper.getInstance().notifyEntryNormal();

    const {
        appID,
        appSign,
        userID,
        userName,
        callID,
        config,
        token = '',
        onRequireNewToken,
    } = props;

    MinimizingHelper.getInstance().setInitParams(appID, appSign, userID, userName, callID, {
        ...config,
        token,
        onRequireNewToken,
    });

    const {
        audioVideoViewConfig = {},

        // turnOnCameraWhenJoining = true,
        // turnOnMicrophoneWhenJoining = true,
        // useSpeakerWhenJoining = true,

        bottomMenuBarConfig = {},
        topMenuBarConfig = {},
        memberListConfig = {},

        layout = {},

        hangUpConfirmInfo, // {title: '', cancelButtonName: '', confirmButtonName: ''}

        onHangUpConfirmation,
        onJoinRoom,
        onCallEnd,
        onUserJoin,
        durationConfig = {}, // Deprecate
        timingConfig = {},
        avatarBuilder,
        foregroundBuilder: prebuiltForegroundBuilder,
        messageItemBuilder,
    } = config;
    const {
        showMicrophoneStateOnView = true,
        showCameraStateOnView = false,
        showUserNameOnView = true,
        showSoundWavesInAudioMode = true,
        useVideoViewAspectFill = true,
        foregroundBuilder,
    } = audioVideoViewConfig;
    const {
        buttons = [
            ZegoMenuBarButtonName.toggleCameraButton,
            ZegoMenuBarButtonName.switchCameraButton,
            ZegoMenuBarButtonName.hangUpButton,
            ZegoMenuBarButtonName.toggleMicrophoneButton,
            ZegoMenuBarButtonName.switchAudioOutputButton
        ],
        maxCount = 5,
        extendButtons = [],
        hideAutomatically = true,
        hideByClick = true,
        style = ZegoMenuBarStyle.light,
    } = bottomMenuBarConfig;
    const {
        isVisible = true,
        title: topTitle = userName || '',
        buttons: topButtons = [],
        maxCount: topMaxCount = 3,
        extendButtons: topExtendButtons = [],
        hideAutomatically: topHideAutomatically = true,
        hideByClick: topHideByClick = true,
        style: topStyle = ZegoMenuBarStyle.light,
    } = topMenuBarConfig;
    const {
        showMicrophoneState = true,
        showCameraState = true,
        itemBuilder,
    } = memberListConfig;
    const {
        enableTiming = durationConfig.isVisible || true,
        isDurationVisible = true,
        onDurationUpdate = durationConfig.onDurationUpdate,
    } = timingConfig

    const stateData = useRef(PrebuiltHelper.getInstance().getStateData());

    const [isFrontCamera, setIsFrontCamera] = useState(stateData.current.isFrontCamera || true);
    const [turnOnCameraWhenJoining, setTurnOnCameraWhenJoining] =
        useState(
            stateData.current.turnOnCameraWhenJoining !== undefined ?
                stateData.current.turnOnCameraWhenJoining :
                (config.turnOnCameraWhenJoining));
    const [turnOnMicrophoneWhenJoining, setTurnOnMicrophoneWhenJoining] =
        useState(
            stateData.current.turnOnMicrophoneWhenJoining !== undefined ?
                stateData.current.turnOnMicrophoneWhenJoining :
                (config.turnOnMicrophoneWhenJoining));
    const [useSpeakerWhenJoining, setUseSpeakerWhenJoining] =
        useState(
            stateData.current.useSpeakerWhenJoining !== undefined ?
                stateData.current.useSpeakerWhenJoining :
                (config.useSpeakerWhenJoining));

    const [isMenubarVisable, setIsMenubarVisable] = useState(true);
    const [isTopMenubarVisable, setTopIsMenubarVisable] = useState(true);
    const [isCallMemberListVisable, setIsCallMemberListVisable] = useState(false);
    const [textInputVisable, setTextInputVisable] = useState(false);
    const keyboardHeight = useKeyboard();

    var hideCountdown = 5;
    var hideCountdownOnTopMenu = 5;

    const debounce = useRef(false);

    const timingTimer = new Timer(elapsed => {
        TimingHelper.getInstance().increaseDuration()
        typeof onDurationUpdate === 'function' && onDurationUpdate(TimingHelper.getInstance().getDuration());
    }, 1000)

    if (stateData.current.callbackID) {
        stateData.current.callbackID = 'ZegoUIKitPrebuiltCall' +
            String(Math.floor(Math.random() * 10000));
    }
    const callbackID = stateData.current.callbackID;

    const isPageInBackground = () => {
        const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
        return isMinimize;
    }
    const onFullPageTouch = () => {
        hideCountdown = 5;
        hideCountdownOnTopMenu = 5;
        if (isMenubarVisable) {
            if (hideByClick) {
                setIsMenubarVisable(false);
                setIsCallMemberListVisable(false);
            }
        } else {
            setIsMenubarVisable(true);
        }
        if (isTopMenubarVisable) {
            if (topHideByClick) {
                setTopIsMenubarVisable(false);
                setIsCallMemberListVisable(false);
            }
        } else {
            setTopIsMenubarVisable(true);
        }
    };
    const grantPermissions = async (callback) => {
        // Android: Dynamically obtaining device permissions
        if (Platform.OS === 'android') {
            // Check if permission granted
            let grantedAudio = PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            );
            let grantedCamera = PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.CAMERA,
            );
            const ungrantedPermissions = [];
            try {
                const isAudioGranted = await grantedAudio;
                const isVideoGranted = await grantedCamera;
                if (!isAudioGranted) {
                    ungrantedPermissions.push(
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    );
                }
                const isVideoCall = buttons.includes(ZegoMenuBarButtonName.toggleCameraButton) || turnOnCameraWhenJoining;
                if (!isVideoGranted && isVideoCall) {
                    ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
                }
            } catch (error) {
                ungrantedPermissions.push(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                );
            }
            // If not, request it
            zloginfo(`[ZegoUIKitPrebuiltCall] requestMultiple, ungrantedPermissions: ${ungrantedPermissions}`);
            return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
                result => {
                    zloginfo(`[ZegoUIKitPrebuiltCall] requestMultiple, result: ${result}`);
                    if (callback) {
                        callback();
                    }
                },
            );
        } else if (callback) {
            callback();
        }
    };
    // Default operation for click the leave button
    const showLeaveAlert = () => {
        return new Promise((resolve, reject) => {
            if (hangUpConfirmInfo) {
                const {
                    title = "Leave the call",
                    message = "Are you sure to leave the call?",
                    cancelButtonName = "Cancel",
                    confirmButtonName = "Confirm"
                } = hangUpConfirmInfo;
                Alert.alert(
                    title,
                    message,
                    [
                        {
                            text: cancelButtonName,
                            onPress: () => {
                                reject();
                            },
                            style: "cancel",
                        },
                        {
                            text: confirmButtonName,
                            onPress: () => {
                                resolve();
                            },
                        },
                    ],
                    {
                        cancelable: false,
                    }
                );
            } else {
                resolve();
            }
        });
    };
    const sortAudioVideo = (globalAudioVideoUserList) => {
        if (layout.mode === ZegoLayoutMode.pictureInPicture) {
            if (globalAudioVideoUserList.length > 1) {
                const index = globalAudioVideoUserList.findIndex(user => user.userID === userID);
                if (index !== -1) {
                    const localUser = globalAudioVideoUserList.splice(index, 1)[0];
                    globalAudioVideoUserList.splice(1, 0, localUser);
                }
            }
            return globalAudioVideoUserList;
        } else {
            // Do not deal with
            return globalAudioVideoUserList;
        }
    };
    const startCallTimingTimer = useCallback(() => {
        if (!enableTiming) return;
        timingTimer.stop()
        timingTimer.start()
    }, []);
    const destroyCallTimingTimer = useCallback((isFromMinimize) => {
        // we need to reset duration when call is ended from minimize
        if (isFromMinimize) {
            TimingHelper.getInstance().resetDuration()
        }
        // we need to reset duration when the call is normal ended.
        else if (!MinimizingHelper.getInstance().getIsMinimizeSwitch()) {
            TimingHelper.getInstance().resetDuration()
        }
        timingTimer.stop()
    }, []);
    const onOpenCallMemberList = () => {
        setIsCallMemberListVisable(true);
    };
    const onCloseCallMemberList = () => {
        setIsCallMemberListVisable(false);
    };
    const onSwitchCamera = () => {
        zloginfo('onSwitchCamera', isFrontCamera);

        // Default rear camera
        const result = !isFrontCamera;
        stateData.current.isFrontCamera = result;
        setIsFrontCamera(result);
    }

    const showMessageListView = () => {
      return buttons.includes(ZegoMenuBarButtonName.messageButton);
    }

    useImperativeHandle(ref, () => ({
        hangUp: (showConfirmation = false) => {
            if (debounce.current) return;
            if (!showConfirmation) {
                debounce.current = true;
                const duration = TimingHelper.getInstance().getDuration();
                typeof onCallEnd == 'function' && onCallEnd(callID, ZegoCallEndReason.localHangUp, duration);
                debounce.current = false;
            } else {
                debounce.current = true;
                const temp = onHangUpConfirmation || showLeaveAlert;
                temp().then(() => {
                    const duration = TimingHelper.getInstance().getDuration();
                    typeof onCallEnd == 'function' && onCallEnd(callID, ZegoCallEndReason.localHangUp, duration);
                    debounce.current = false;
                });
            }
        },
        minimizeWindow: () => {
            MinimizingHelper.getInstance().minimizeWindow();
        },
    }));

    const handleBackButton = () => {
        return true;
    }

    useEffect(() => {
        ZegoUIKit.onJoinRoom(callbackID, onJoinRoom);
        ZegoUIKit.onOnlySelfInRoom(callbackID, () => {
            const duration = TimingHelper.getInstance().getDuration();
            if (typeof onCallEnd == 'function') {
              onCallEnd(callID, ZegoCallEndReason.remoteHangUp, duration);
            }
        });
        ZegoUIKit.onUserJoin(callbackID, onUserJoin);
        ZegoUIKit.onMeRemovedFromRoom(callbackID, () => {
          const duration = TimingHelper.getInstance().getDuration();
          if (typeof onCallEnd == 'function') {
            onCallEnd(callID, ZegoCallEndReason.kickOut, duration);
          }
        });
        ZegoUIKit.onRequireNewToken(callbackID, onRequireNewToken);
        ZegoUIKit.onMicrophoneOn(callbackID, (targetUserID, isOn) => {
            if (targetUserID === userID) {
                stateData.current.turnOnMicrophoneWhenJoining = !!isOn;
            }
        });
        ZegoUIKit.onCameraOn(callbackID, (targetUserID, isOn) => {
            if (targetUserID === userID) {
                stateData.current.turnOnCameraWhenJoining = !!isOn;
            }
        });
        ZegoUIKit.onAudioOutputDeviceChanged(callbackID, (type) => {
            stateData.current.useSpeakerWhenJoining = (type === 0);
        });
        PrebuiltHelper.getInstance().onPrebuiltDestroy(callbackID, () => {
          zloginfo('[ZegoUIKitPrebuiltCall] onPrebuiltDestroy', callbackID);
            ZegoUIKit.leaveRoom();
            ZegoUIKit.onJoinRoom(callbackID);
            ZegoUIKit.onOnlySelfInRoom(callbackID);
            ZegoUIKit.onUserJoin(callbackID);
            ZegoUIKit.onMeRemovedFromRoom(callbackID);
            ZegoUIKit.onRequireNewToken(callbackID);

            destroyCallTimingTimer(true);
            PrebuiltHelper.getInstance().clearState();
            PrebuiltHelper.getInstance().clearRouteParams();
            PrebuiltHelper.getInstance().clearNotify();

            MinimizingHelper.getInstance().setIsMinimizeSwitch(false);
            MinimizingHelper.getInstance().notifyEntryNormal();
            KeepAwake.deactivate();
        })

        ZegoUIKit.init(
            appID,
            appSign,
            { userID: userID, userName: userName }).then(() => {
                MinimizingHelper.getInstance().notifyPrebuiltInit();

                ZegoUIKit.setAudioOutputToSpeaker(useSpeakerWhenJoining);

                if (appSign) {
                    ZegoUIKit.joinRoom(callID);
                } else {
                    ZegoUIKit.joinRoom(callID, token || (typeof onRequireNewToken === 'function' ? (onRequireNewToken() || '') : ''));
                }
                startCallTimingTimer();
                grantPermissions(() => {
                    // RTC need it
                    ZegoUIKit.turnCameraOn('', false);
                    ZegoUIKit.turnCameraOn('', turnOnCameraWhenJoining);
                    ZegoUIKit.useFrontFacingCamera(isFrontCamera);
                    ZegoUIKit.turnMicrophoneOn('', turnOnMicrophoneWhenJoining);
                });

            });

        BackHandler.addEventListener('hardwareBackPress', handleBackButton);
        navigation.setOptions({ gestureEnabled: false });
        KeepAwake.activate();

        // Initialize after use
        MinimizingHelper.getInstance().setIsMinimizeSwitch(false);
        return () => {
            const isMinimizeSwitch = MinimizingHelper.getInstance().getIsMinimizeSwitch();
            if (!isMinimizeSwitch) {
                ZegoUIKit.leaveRoom();
                ZegoUIKit.onJoinRoom(callbackID);
                ZegoUIKit.onOnlySelfInRoom(callbackID);
                ZegoUIKit.onUserJoin(callbackID);
                ZegoUIKit.onMeRemovedFromRoom(callbackID);
                ZegoUIKit.onRequireNewToken(callbackID);

                PrebuiltHelper.getInstance().clearState();
                PrebuiltHelper.getInstance().clearRouteParams();
                PrebuiltHelper.getInstance().clearNotify();
                KeepAwake.deactivate();
            }
            destroyCallTimingTimer(false);
            BackHandler.removeEventListener('hardwareBackPress', handleBackButton);
            navigation.setOptions({ gestureEnabled: true });
        }
    }, []);

    function useInterval(callback, delay) {
        const savedCallback = useRef();

        useEffect(() => {
            savedCallback.current = callback;
        });

        useEffect(() => {
            function tick() {
                savedCallback.current();
            }
            if (delay !== null) {
                let id = setInterval(tick, delay);
                return () => clearInterval(id);
            }
        }, [delay]);
    }
    useInterval(() => {
        hideCountdown--;
        if (hideCountdown <= 0) {
            hideCountdown = 5;
            if (hideAutomatically) {
                setIsMenubarVisable(false);
            }
        }
    }, 1000);
    useInterval(() => {
        hideCountdownOnTopMenu--;
        if (hideCountdownOnTopMenu <= 0) {
            hideCountdownOnTopMenu = 5;
            if (topHideAutomatically) {
                setTopIsMenubarVisable(false);
            }
        }
    }, 1000);

    return (
        <View style={[styles.container, styles.fillParent]}>
          <View style={styles.foregroundContainer} pointerEvents='none'>
            <ZegoPrebuiltForegroundView
              style={styles.foregroundView}
              isDurationVisible={isDurationVisible}
            />
          </View>
          <View style={styles.foregroundBuilderContainer} pointerEvents='box-none'>
            <Delegate
              // style={styles.foregroundBuilderDelegate}
              to={prebuiltForegroundBuilder}
            />
          </View>
          {isVisible && isTopMenubarVisable ?
              <ZegoTopMenuBar
                  menuTitle={topTitle}
                  menuBarButtonsMaxCount={topMaxCount}
                  menuBarButtons={topButtons}
                  menuBarExtendedButtons={topExtendButtons}
                  onHangUp={() => {
                      const duration = TimingHelper.getInstance().getDuration();
                      typeof onCallEnd == 'function' && onCallEnd(callID, ZegoCallEndReason.localHangUp, duration);
                  }}
                  onHangUpConfirmation={onHangUpConfirmation ? onHangUpConfirmation : showLeaveAlert}
                  turnOnCameraWhenJoining={turnOnCameraWhenJoining}
                  turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
                  useSpeakerWhenJoining={useSpeakerWhenJoining}
                  onOpenCallMemberList={onOpenCallMemberList}
                  onSwitchCamera={onSwitchCamera}
                  onMessagePress={() => {
                    setTextInputVisable(true);
                    setIsMenubarVisable(false);
                    setTopIsMenubarVisable(false);
                  }}
              /> : <View />
          }
          <View style={styles.fillParent} pointerEvents='auto' onTouchStart={onFullPageTouch}>
            <ZegoAudioVideoContainer
              style={[styles.audioVideoView, styles.fillParent]}
              audioVideoConfig={{
                  showSoundWavesInAudioMode: showSoundWavesInAudioMode,
                  useVideoViewAspectFill: useVideoViewAspectFill,
                  cacheAudioVideoUserList: isMinimizeSwitch ?
                      ZegoUIKit.getAllUsers().filter(user => user.userID && (user.isCameraOn || user.isMicrophoneOn)) :
                      null
              }}
              layout={layout}
              avatarBuilder={avatarBuilder}
              foregroundBuilder={foregroundBuilder ? foregroundBuilder : ({ userInfo }) =>
                  <AudioVideoForegroundView
                      userInfo={userInfo}
                      showMicrophoneStateOnView={showMicrophoneStateOnView}
                      showCameraStateOnView={showCameraStateOnView}
                      showUserNameOnView={showUserNameOnView}
                  />
              }
              sortAudioVideo={sortAudioVideo}
            />
            {/* Message list */}
            {
              showMessageListView() ? <View style={styles.messageListView}>
                <ZegoInRoomMessageView itemBuilder={messageItemBuilder} style={styles.fillParent} />
              </View> : null
            }
          </View>
          {isMenubarVisable ?
              <ZegoBottomBar
                  menuBarButtonsMaxCount={maxCount}
                  menuBarButtons={buttons}
                  menuBarExtendedButtons={extendButtons}
                  onHangUp={() => {
                      const duration = TimingHelper.getInstance().getDuration();
                      typeof onCallEnd == 'function' && onCallEnd(callID, ZegoCallEndReason.localHangUp, duration);
                  }}
                  onHangUpConfirmation={onHangUpConfirmation ? onHangUpConfirmation : showLeaveAlert}
                  turnOnCameraWhenJoining={turnOnCameraWhenJoining}
                  turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
                  useSpeakerWhenJoining={useSpeakerWhenJoining}
                  onMorePress={() => { hideCountdown = 5; }}
                  onSwitchCamera={onSwitchCamera}
                  onMessagePress={() => {
                    setTextInputVisable(true);
                    setIsMenubarVisable(false);
                    setTopIsMenubarVisable(false);
                  }}
              /> :
              <View />
          }
          {isCallMemberListVisable ?
              <ZegoCallMemberList
                  showMicrophoneState={showMicrophoneState}
                  showCameraState={showCameraState}
                  itemBuilder={itemBuilder}
                  avatarBuilder={avatarBuilder}
                  onCloseCallMemberList={onCloseCallMemberList}
              /> :
              <View />
          }
          {textInputVisable ? <TouchableOpacity
            style={styles.fillParent}
            // behavior={'padding'}
            onPress={() => { setTextInputVisable(false); }}
          >
            <View
              style={[
                styles.messageInputPannel,
                {
                  bottom: Platform.OS == 'ios' ? keyboardHeight : 0,
                  height: 45,
                },
              ]}
            >
              <ZegoInRoomMessageInput
                ref={(input) => {
                  // setTextInput(input);
                }}
                // @ts-ignore
                onContentSizeChange={(height) => {
                  // setTextInputHeight(height);
                }}
                placeholder={'Say something...'}
                onSumit={() => {
                  setTextInputVisable(false);
                }}
              />
            </View>
          </TouchableOpacity> : null}
        </View>
    );
}

export default forwardRef(ZegoUIKitPrebuiltCall);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    fillParent: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    audioVideoView: {
        flex: 1,
        zIndex: 2,
        right: 0,
        top: 0,
    },
    foregroundContainer: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 6,
        zIndex: 11,
        alignItems: 'center',
    },
    foregroundView: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    foregroundBuilderDelegate: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    foregroundBuilderContainer: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 21,
        alignItems: 'center',
    },
    messageInputPannel: {
      position: 'absolute',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.7500)',
      width: '100%',
    },
    messageListView: {
      position: 'absolute',
      left: 16,
      bottom: 40,
      width: 230,
      maxHeight: 200,
      zIndex: 10,
    },
});
