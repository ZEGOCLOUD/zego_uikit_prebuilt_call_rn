import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ZegoCallKit, {
    ZegoInvitationType,
    ONE_ON_ONE_VIDEO_CALL_CONFIG,
    ONE_ON_ONE_VOICE_CALL_CONFIG,
    GROUP_VIDEO_CALL_CONFIG,
    GROUP_VOICE_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import KeyCenter from '../KeyCenter';
import ZegoUIKitSignalingPlugin from './plugin';
import { getFirstInstallTime } from 'react-native-device-info'

export default function HomePage() {
    const navigation = useNavigation();
    const [userID, setUserID] = useState('');
    const [userName, setUserName] = useState('');

    const initHandle = () => {
        const userInfo = { userID, userName };
        ZegoCallKit.init(
            KeyCenter.appID,
            KeyCenter.appSign,
            userInfo,
            {
                // token: '',
                // onRequireNewToken: () => '',
                ringtoneConfig: {
                    incomingCallFileName: 'zego_incoming.mp3',
                    outgoingCallFileName: 'zego_outgoing.mp3',
                },
                requireConfig: (data) => {
                    console.warn('requireConfig', data);
                    const callConfig =
                      data.invitees.length > 1
                        ? ZegoInvitationType.videoCall === data.type
                          ? GROUP_VIDEO_CALL_CONFIG
                          : GROUP_VOICE_CALL_CONFIG
                        : ZegoInvitationType.videoCall === data.type
                          ? ONE_ON_ONE_VIDEO_CALL_CONFIG
                          : ONE_ON_ONE_VOICE_CALL_CONFIG;
                    return {
                      ...callConfig,
                    };
                }
            },
            [ZegoUIKitSignalingPlugin]).then(() => {
            console.log('init success!');
            // Go to the invitation page
            navigation.navigate('MemberListPage');
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
