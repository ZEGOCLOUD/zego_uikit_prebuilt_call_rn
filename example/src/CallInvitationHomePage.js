import React from "react";
import ZegoUIKitPrebuiltInvitationCall, { ZegoStartCallInvitationButton } from '@zegocloud/zego-uikit-prebuilt-call-rn'
import ZegoUIKitSignalingPlugin from "@zegocloud/zego-signaling-plugin";
import { View, Text } from "react-native";

export default function CallInvitationHomePage(props) {
    return (<ZegoUIKitPrebuiltInvitationCall plugins={ZegoUIKitSignalingPlugin}>
        <Text>124</Text>
    </ZegoUIKitPrebuiltInvitationCall>);
}