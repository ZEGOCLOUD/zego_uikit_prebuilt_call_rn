import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from "./HomePage";
import VideoCallPage from "./VideoCallPage";
import VoiceCallPage from "./VoiceCallPage";

const Stack = createNativeStackNavigator();

export default function AppNavigation(props) {
    return (
        <Stack.Navigator initialRouteName="HomePage">
            <Stack.Screen options={{headerShown: false}} headerMode="none" name="HomePage" component={HomePage} />
            <Stack.Screen options={{headerShown: false}} name="VideoCallPage" component={VideoCallPage} />
            <Stack.Screen options={{headerShown: false}} name="VoiceCallPage" component={VoiceCallPage} />
        </Stack.Navigator>
    );
}