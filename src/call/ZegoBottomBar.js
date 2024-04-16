import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
    ZegoLeaveButton,
    ZegoSwitchAudioOutputButton,
    ZegoSwitchCameraButton,
    ZegoToggleCameraButton,
    ZegoToggleMicrophoneButton
} from '@zegocloud/zego-uikit-rn'

import ZegoMoreButton from './ZegoMoreButton';
import ZegoMenuBarButtonName from "./ZegoMenuBarButtonName";
import ZegoMessageButton from "./ZegoMessageButton";


export default function ZegoBottomBar(props) {
    const {
        menuBarButtonsMaxCount = 5,
        menuBarButtons = [],
        menuBarExtendedButtons = [],
        onHangUp,
        onHangUpConfirmation,
        turnOnCameraWhenJoining,
        turnOnMicrophoneWhenJoining,
        useSpeakerWhenJoining,
        onMorePress,
        onSwitchCamera,
        onMessagePress,
        buttonBuilders = {},
    } = props;
    const [isNormalStyle, setIsNormalStyle] = useState(true);

    const getButtonByButtonIndex = (buttonIndex) => {
        switch (buttonIndex) {
            case ZegoMenuBarButtonName.toggleCameraButton:
                return <ZegoToggleCameraButton key={1} isOn={turnOnCameraWhenJoining} />;
            case ZegoMenuBarButtonName.toggleMicrophoneButton:
                return <ZegoToggleMicrophoneButton key={2} isOn={turnOnMicrophoneWhenJoining} />;
            case ZegoMenuBarButtonName.hangUpButton:
                return <ZegoLeaveButton key={0} onLeaveConfirmation={onHangUpConfirmation} onPressed={onHangUp} iconBuilder={buttonBuilders.hangupBuilder} />
            case ZegoMenuBarButtonName.switchAudioOutputButton:
                return <ZegoSwitchAudioOutputButton key={4} useSpeaker={useSpeakerWhenJoining} />
            case ZegoMenuBarButtonName.switchCameraButton:
                return <ZegoSwitchCameraButton key={3} onPress={onSwitchCamera}/>
            case ZegoMenuBarButtonName.messageButton:
                return <ZegoMessageButton key={7} onPress={onMessagePress} />
        }
    }
    const getDisplayButtons = () => {
        var maxCount = menuBarButtonsMaxCount < 1 ? 1 : menuBarButtonsMaxCount;
        maxCount = maxCount > 5 ? 5 : maxCount;
        const needMoreButton = (menuBarButtons.length + menuBarExtendedButtons.length) > maxCount;
        const firstLevelButtons = [];
        const secondLevelButtons = [];
        menuBarButtons.forEach(buttonIndex => {
            const limitCount = needMoreButton ? maxCount - 1 : maxCount;
            if (firstLevelButtons.length < limitCount) {
                firstLevelButtons.push(getButtonByButtonIndex(buttonIndex));
            } else {
                secondLevelButtons.push(getButtonByButtonIndex(buttonIndex));
            }
        });
        menuBarExtendedButtons.forEach(button => {
            const limitCount = needMoreButton ? maxCount - 1 : maxCount;
            if (firstLevelButtons.length < limitCount) {
                firstLevelButtons.push(button);
            } else {
                secondLevelButtons.push(button);
            }
        });
        if (needMoreButton) {
            firstLevelButtons.push(<ZegoMoreButton onPress={() => { setIsNormalStyle(false); if (onMorePress) onMorePress() }} />)
        }
        return {
            firstLevelButtons: firstLevelButtons,
            secondLevelButtons: secondLevelButtons
        }
    }
    const getButtonStyle = () => {
        const btnStyles = [styles.ctrlBtn1, styles.ctrlBtn2, styles.ctrlBtn3, styles.ctrlBtn4, styles.ctrlBtn5,]
        return btnStyles[firstLevelButtons.length - 1]
    }

    var allButtons = getDisplayButtons();
    var firstLevelButtons = allButtons['firstLevelButtons']
    var secondLevelButtons = allButtons['secondLevelButtons']

    return (
        isNormalStyle ?
            <View style={styles.normalBar}>
                {firstLevelButtons.map((button, index) => (
                    <View key={index} style={getButtonStyle()}>
                        {button}
                    </View>
                ))}
            </View> :
            <View style={[styles.popupContainer, styles.fillParent]}>
                <View style={[styles.popupMask, styles.fillParent]} >
                    <TouchableOpacity style={styles.fillParent} onPress={() => { setIsNormalStyle(true) }} />
                </View>
                <View style={styles.popupBar}>
                    {secondLevelButtons.map((button, index) => (
                        <View key={index} style={{ marginBottom: 20, marginRight: 32 / 2, marginLeft: 32 / 2 }}>
                            {button}
                        </View>
                    ))}
                </View>
            </View>
    );
}

const styles = StyleSheet.create({
    normalBar: {
        flex: 1,
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 50,
        width: '100%',
        bottom: 0,
        height: 50,
        zIndex: 2,
    },
    popupContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    fillParent: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    popupMask: {
        backgroundColor: '#262A2D',
        opacity: 0.3,
    },
    popupBar: {
        flex: 1,
        paddingTop: 27,
        paddingBottom: 3,
        paddingLeft: 28.5,
        paddingRight: 28.5,
        position: 'absolute',
        flexDirection: 'row',
        flexWrap: "wrap",
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        width: '100%',
        bottom: 0,
        zIndex: 2,
        backgroundColor: '#262A2D'
    },
    ctrlBtn1: {
        marginLeft: 0,
        marginRight: 0,
    },
    ctrlBtn2: {
        marginLeft: 79 / 2,
        marginRight: 79 / 2,
    },
    ctrlBtn3: {
        marginLeft: 59.5 / 2,
        marginRight: 59.5 / 2,
    },
    ctrlBtn4: {
        marginLeft: 37 / 2,
        marginRight: 37 / 2,
    },
    ctrlBtn5: {
        marginLeft: 23 / 2,
        marginRight: 23 / 2,
    }
});