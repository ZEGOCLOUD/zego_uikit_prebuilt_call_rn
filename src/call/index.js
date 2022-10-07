import React, { useEffect, useState, useRef } from 'react';
import { PermissionsAndroid, Alert } from 'react-native';

import { StyleSheet, View } from 'react-native';
import ZegoUIKit, { ZegoAudioVideoContainer } from '@zegocloud/zego-uikit-rn'
import AudioVideoForegroundView from './AudioVideoForegroundView';
import ZegoBottomBar from './ZegoBottomBar';
import ZegoMenuBarButtonName from './ZegoMenuBarButtonName';
import ZegoMenuBarStyle from './ZegoMenuBarStyle';


export default function ZegoUIKitPrebuiltCall(props) {
    const {
        appID,
        appSign,
        userID,
        userName,
        callID,
        config,
    } = props;
    const {
        audioVideoViewConfig = {},

        turnOnCameraWhenJoining = true,
        turnOnMicrophoneWhenJoining = true,
        useSpeakerWhenJoining = true,

        bottomMenuBarConfig = {},

        layout = {},

        hangUpConfirmInfo, // {title: '', cancelButtonName: '', confirmButtonName: ''}

        onHangUp,
        onHangUpConfirmation,
        onOnlySelfInRoom,
    } = config;
    const {
        showMicrophoneStateOnView = true,
        showCameraStateOnView = false,
        showUserNameOnView = true,
        ShowSoundWavesInAudioMode = true,
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
        extendedButtons = [],
        hideAutomatically = true,
        hideByClick = true,
        style = ZegoMenuBarStyle.light,
    } = bottomMenuBarConfig;

    const [isMenubarVisable, setIsMenubarVidable] = useState(true);
    var hideCountdown = 5;

    const onFullPageTouch = () => {
        hideCountdown = 5;
        if (isMenubarVisable) {
            if (hideByClick) {
                setIsMenubarVidable(false);
            }
        } else {
            setIsMenubarVidable(true);
        }
    }
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
                if (!isVideoGranted) {
                    ungrantedPermissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
                }
            } catch (error) {
                ungrantedPermissions.push(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                );
            }
            // If not, request it
            return PermissionsAndroid.requestMultiple(ungrantedPermissions).then(
                data => {
                    console.warn('requestMultiple', data);
                    if (callback) {
                        callback();
                    }
                },
            );
        } else if (callback) {
            callback();
        }
    }
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
    }

    useEffect(() => {
        const callbackID = 'ZegoUIKitPrebuiltCall' + String(Math.floor(Math.random() * 10000));
        ZegoUIKit.onOnlySelfInRoom(callbackID, () => {
            if (typeof onOnlySelfInRoom == 'function') {
                onOnlySelfInRoom();
            }
        });
        return () => {
            ZegoUIKit.onOnlySelfInRoom(callbackID);
        }
    }, [])
    useEffect(() => {
        ZegoUIKit.init(
            appID,
            appSign,
            { userID: userID, userName: userName }).then(() => {

                ZegoUIKit.turnCameraOn('', turnOnCameraWhenJoining);
                ZegoUIKit.turnMicrophoneOn('', turnOnMicrophoneWhenJoining);
                ZegoUIKit.setAudioOutputToSpeaker(useSpeakerWhenJoining);

                grantPermissions(() => {
                    ZegoUIKit.joinRoom(callID);
                });

            });

        return () => {
            ZegoUIKit.leaveRoom();
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
                setIsMenubarVidable(false);
            }
        }
    }, 1000);

    return (
        <View style={styles.container} >
            <View style={styles.fillParent} pointerEvents='auto' onTouchStart={onFullPageTouch}>
                <ZegoAudioVideoContainer style={[styles.avView, styles.fillParent]}
                    audioVideoConfig={{
                        showSoundWavesInAudioMode: ShowSoundWavesInAudioMode,
                        useVideoViewAspectFill: useVideoViewAspectFill,
                    }}
                    layout={layout}
                    foregroundBuilder={foregroundBuilder ? foregroundBuilder : ({ userInfo }) =>
                        <AudioVideoForegroundView
                            userInfo={userInfo}
                            showMicrophoneStateOnView={showMicrophoneStateOnView}
                            showCameraStateOnView={showCameraStateOnView}
                            showUserNameOnView={showUserNameOnView}
                        />
                    }
                />
            </View>
            {isMenubarVisable ?
                <ZegoBottomBar
                    menuBarButtonsMaxCount={maxCount}
                    menuBarButtons={buttons}
                    menuBarExtendedButtons={extendedButtons}
                    onHangUp={onHangUp}
                    onHangUpConfirmation={onHangUpConfirmation ? onHangUpConfirmation : showLeaveAlert}
                    turnOnCameraWhenJoining={turnOnCameraWhenJoining}
                    turnOnMicrophoneWhenJoining={turnOnMicrophoneWhenJoining}
                    useSpeakerWhenJoining={useSpeakerWhenJoining}
                    onMorePress={() => { hideCountdown = 5; }}
                /> :
                <View />
            }
        </View>
    );
}

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
    avView: {
        flex: 1,
        zIndex: 2,
        right: 0,
        top: 0,
    },
});
