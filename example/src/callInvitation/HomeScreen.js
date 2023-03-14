import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, Alert } from 'react-native';

import {useNavigation} from '@react-navigation/native';
import ZegoUIKitPrebuiltCallService, {
    ZegoInvitationType,
    ONE_ON_ONE_VIDEO_CALL_CONFIG,
    ONE_ON_ONE_VOICE_CALL_CONFIG,
    GROUP_VIDEO_CALL_CONFIG,
    GROUP_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import KeyCenter from '../KeyCenter';
import ZegoUIKitSignalingPlugin from './plugin';
import { getFirstInstallTime } from 'react-native-device-info'

export default function HomeScreen(props) {
    const navigation = useNavigation();
    const [userID, setUserID] = useState('');
    const [userName, setUserName] = useState('');

    const initHandle = () => {
        ZegoUIKitPrebuiltCallService.init(
            KeyCenter.appID,
            KeyCenter.appSign,
            userID,
            userName,
            [ZegoUIKitSignalingPlugin],
            {
                token: '',
                onRequireNewToken: () => '',
                ringtoneConfig: {
                    incomingCallFileName: 'zego_incoming.mp3',
                    outgoingCallFileName: 'zego_outgoing.mp3',
                },
                innerText: {},
                showDeclineButton: true,
                notifyWhenAppRunningInBackgroundOrQuit: false,
                isIOSSandboxEnvironment: true,
                androidNotificationConfig: {
                    channelID: "CallInvitation",
                    channelName: "CallInvitation",
                },
                onIncomingCallDeclineButtonPressed: () => {
                    console.log('[Demo]onIncomingCallDeclineButtonPressed');
                },
                onIncomingCallAcceptButtonPressed: () => {
                    console.log('[Demo]onIncomingCallAcceptButtonPressed');
                },
                onIncomingCallReceived: (callID, inviter, type, invitees) => {
                    console.log('[Demo]onIncomingCallReceived', callID, inviter, type, invitees);
                },
                onIncomingCallCanceled: (callID, inviter) => {
                    console.log('[Demo]onIncomingCallCanceled', callID, inviter);
                },
                onOutgoingCallAccepted: (callID, invitee) => {
                    console.log('[Demo]onOutgoingCallAccepted', callID, invitee);
                },
                onOutgoingCallRejectedCauseBusy: (callID, invitee) => {
                    console.log('[Demo]onOutgoingCallRejectedCauseBusy', callID, invitee);
                },
                onOutgoingCallDeclined: (callID, invitee) => {
                    console.log('[Demo]onOutgoingCallDeclined', callID, invitee);
                },
                onIncomingCallTimeout: (callID, inviter) => {
                    console.log('[Demo]onIncomingCallTimeout', callID, inviter);
                },
                onOutgoingCallTimeout: (callID, invitees) => {
                    console.log('[Demo]onOutgoingCallTimeout', callID, invitees);
                },
            }).then(() => {
            console.log('[Demo]init success!');
            // Go to the invitation page
            navigation.navigate('MemberListScreen');
        });
    }

    useEffect(() => {
        getFirstInstallTime().then(firstInstallTime => {
            const id = String(firstInstallTime).slice(-5);
            setUserID(id);
            setUserName('user_' + id);
        });
    }, []);

    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ marginBottom: 30 }}>
            <Text>appID: {KeyCenter.appID}</Text>
            <Text>userID: {userID}</Text>
            <Text>userName: {userName}</Text>
        </View>
        <View style={{ width: 160 }}>
            <Button title='Init' onPress={initHandle}></Button>
        </View>
    </View>;
}
