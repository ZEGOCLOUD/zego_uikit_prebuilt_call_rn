import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from "./HomePage";
import CallInvitationHomePage from "./CallInvitationHomePage";
import VideoCallPage from "./VideoCallPage";
import VoiceCallPage from "./VoiceCallPage";
import GroupVideoCallPage from "./GroupVideoCallPage";
import GroupVoiceCallPage from "./GroupVoiceCallPage";

const Stack = createNativeStackNavigator();

export default function AppNavigation(props) {
    return (
        <Stack.Navigator initialRouteName="CallInvitationHomePage">
            <Stack.Screen options={{headerShown: false}} headerMode="none" name="CallInvitationHomePage" component={CallInvitationHomePage} />
            <Stack.Screen options={{headerShown: false}} headerMode="none" name="HomePage" component={HomePage} />
            <Stack.Screen options={{headerShown: false}} name="VideoCallPage" component={VideoCallPage} />
            <Stack.Screen options={{headerShown: false}} name="VoiceCallPage" component={VoiceCallPage} />
            <Stack.Screen options={{headerShown: false}} name="GroupVideoCallPage" component={GroupVideoCallPage} />
            <Stack.Screen options={{headerShown: false}} name="GroupVoiceCallPage" component={GroupVoiceCallPage} />
        </Stack.Navigator>
    );
}