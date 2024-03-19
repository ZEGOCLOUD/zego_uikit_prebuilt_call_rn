import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image, View } from 'react-native';
import MinimizingHelper from "./services/minimizing_helper";
import { getMethodReturnValue } from "../utils"

export default function ZegoMessageButton(props: any) {
    const {
        width = 48,
        height = 48,
        icon = require('./resources/white_bottom_button_chat.png'),
        onPress,
    } = props;

    return (
        <TouchableOpacity
          style={{ width: width, height: height }}
          onPress={onPress}
        >
        <Image
          source={icon}
          resizeMode='contain'
          style={{ width: "100%", height: "100%" }}
        />
        </TouchableOpacity>
    );
}