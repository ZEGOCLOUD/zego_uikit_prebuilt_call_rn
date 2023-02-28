import React, { Fragment } from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomePage from "./HomePage";
import MemberListPage from "./MemberListPage";
import {
    ZegoCallInvitationWaiting,
    ZegoCallInvitationRoom,
    ZegoCallInvitationDialog,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';

const Stack = createNativeStackNavigator();

export default function AppNavigation(props) {
    return (
        <Fragment>
            <ZegoCallInvitationDialog />
            <Stack.Navigator initialRouteName="HomePage">
                <Stack.Screen
                    name="HomePage"
                    component={HomePage}
                />
                <Stack.Screen
                    name="MemberListPage"
                    component={MemberListPage}
                />
                <Stack.Screen
                    options={{ headerShown: false }}
                    name="ZegoCallInvitationWaitingPage"
                    component={ZegoCallInvitationWaiting}
                />
                <Stack.Screen
                    options={{ headerShown: false }}
                    name="ZegoCallInvitationRoomPage"
                    component={ZegoCallInvitationRoom}
                />
            </Stack.Navigator>
        </Fragment>
    );
}