import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { Component, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  ZegoCallInvitationDialog,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
// import AppNavigation from './call/AppNavigation';
import AppNavigation from './callInvitation/AppNavigation';


export default function App() {
  return (<NavigationContainer >
    {/* call invitation need */}
    <ZegoCallInvitationDialog />
    <AppNavigation />
  </NavigationContainer>);
}