import React, { useState } from "react";
import { View, Text, Image, TouchableWithoutFeedback, SafeAreaView, StyleSheet } from "react-native";
import ZegoMenuBarButtonName from "./ZegoMenuBarButtonName";
import ZegoMemberButton from "./ZegoMemberButton";
import ZegoMinimizingButton from "./ZegoMinimizingButton";
import {
    ZegoLeaveButton,
    ZegoSwitchAudioOutputButton,
    ZegoSwitchCameraButton,
    ZegoToggleCameraButton,
    ZegoToggleMicrophoneButton
} from '@zegocloud/zego-uikit-rn'
import ZegoMessageButton from "./ZegoMessageButton";

export default function ZegoTopBar(props) {
    const {
        menuTitle,
        menuBarButtonsMaxCount,
        menuBarButtons,
        menuBarExtendedButtons,
        onHangUp,
        onHangUpConfirmation,
        onSwitchCamera,
        onOpenCallMemberList,
        turnOnCameraWhenJoining,
        turnOnMicrophoneWhenJoining,
        useSpeakerWhenJoining,
        onMessagePress,
    } = props;

    const getButtonByButtonIndex = (buttonIndex) => {
        switch (buttonIndex) {
            case ZegoMenuBarButtonName.toggleCameraButton:
                return <ZegoToggleCameraButton key={1} width={30} height={30} isOn={turnOnCameraWhenJoining} />;
            case ZegoMenuBarButtonName.toggleMicrophoneButton:
                return <ZegoToggleMicrophoneButton key={2} width={30} height={30} isOn={turnOnMicrophoneWhenJoining} />;
            case ZegoMenuBarButtonName.hangUpButton:
                return <ZegoLeaveButton key={0} width={30} height={30} onLeaveConfirmation={onHangUpConfirmation} onPressed={onHangUp} />
            case ZegoMenuBarButtonName.switchAudioOutputButton:
                return <ZegoSwitchAudioOutputButton key={4} width={30} height={30} useSpeaker={useSpeakerWhenJoining} />
            case ZegoMenuBarButtonName.switchCameraButton:
                return <ZegoSwitchCameraButton key={3} width={30} height={30} onPress={onSwitchCamera}/>
            case ZegoMenuBarButtonName.showMemberListButton:
                return <ZegoMemberButton key={5} onPressed={onOpenCallMemberList}/>
            case ZegoMenuBarButtonName.minimizingButton:
                return <ZegoMinimizingButton key={6} />
            case ZegoMenuBarButtonName.messageButton:
                return <ZegoMessageButton key={7} width={30} height={30} onPress={onMessagePress} />
        }
    };
    const getDisplayButtons = () => {
        let allButtons = [];
        menuBarButtons.slice(0, menuBarButtonsMaxCount).forEach(buttonIndex => {
            allButtons.push(getButtonByButtonIndex(buttonIndex));
        });
        allButtons = allButtons.concat(menuBarExtendedButtons);
        return allButtons;
    };
    const getButtonStyle = () => {
        return styles.customIconContainer;
    };

    const allButtons = getDisplayButtons();

    return (<View style={styles.topBarContainer}>
        <View style={styles.left}>
            <TouchableWithoutFeedback>
                <Image
                    style={styles.downArrowIcon}
                    source={require('./resources/white_button_arrow.png')}
                />
            </TouchableWithoutFeedback>
            <Text style={styles.title}>{menuTitle}</Text>
        </View>
        <View style={styles.right}>{
            allButtons.map((button, index) => <View key={index} style={getButtonStyle()}>{button}</View>)
        }</View>
    </View>);
}

const styles = StyleSheet.create({
    topBarContainer: {
        flex: 1,
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        top: 35,
        height: 44,
        zIndex: 3,
        justifyContent: 'space-between',
        paddingLeft: 3.5,
        paddingRight: 13.5,
    },
    left: {
        opacity: 0,
        flexDirection: 'row',
        alignItems: "center",
    },
    right: {
        flexDirection: 'row',
        alignItems: "center",
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        marginLeft: 4,
    },
    customIconContainer: {
        marginLeft: 10,
    },
});
