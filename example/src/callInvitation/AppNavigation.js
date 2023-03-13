import React, { Fragment } from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from "./HomeScreen";
import MemberListScreen from "./MemberListScreen";
import {
    ZegoUIKitPrebuiltCallWaitingScreen,
    ZegoUIKitPrebuiltCallInCallScreen,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

const Stack = createNativeStackNavigator();

export default function AppNavigation(props) {
    return (
        <Stack.Navigator initialRouteName="HomeScreen">
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
            />
            <Stack.Screen
                name="MemberListScreen"
                component={MemberListScreen}
            />
            <Stack.Screen
                options={{ headerShown: false }}
                name="ZegoUIKitPrebuiltCallWaitingScreen"
                component={ZegoUIKitPrebuiltCallWaitingScreen}
            />
            <Stack.Screen
                options={{ headerShown: false }}
                name="ZegoUIKitPrebuiltCallInCallScreen"
                component={ZegoUIKitPrebuiltCallInCallScreen}
            />
        </Stack.Navigator>
    );
}