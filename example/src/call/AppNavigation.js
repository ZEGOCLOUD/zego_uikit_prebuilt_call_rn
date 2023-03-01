import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import VideoCallScreen from './VideoCallScreen';
import VoiceCallScreen from './VoiceCallScreen';
import GroupVideoCallScreen from './GroupVideoCallScreen';
import GroupVoiceCallScreen from './GroupVoiceCallScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigation(props) {
  return (
    <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen
        options={{headerShown: false}}
        headerMode="none"
        name="HomeScreen"
        component={HomeScreen}
      />
      <Stack.Screen
        options={{headerShown: false}}
        name="VideoCallScreen"
        component={VideoCallScreen}
      />
      <Stack.Screen
        options={{headerShown: false}}
        name="VoiceCallScreen"
        component={VoiceCallScreen}
      />
      <Stack.Screen
        options={{headerShown: false}}
        name="GroupVideoCallScreen"
        component={GroupVideoCallScreen}
      />
      <Stack.Screen
        options={{headerShown: false}}
        name="GroupVoiceCallScreen"
        component={GroupVoiceCallScreen}
      />
    </Stack.Navigator>
  );
}
