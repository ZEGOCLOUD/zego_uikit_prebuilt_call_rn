import React from "react";
import { View, TouchableOpacity, Image } from "react-native"

export default function ZegoMoreButton(props) {
    const { onPress } = props;

    return (<View>
        <TouchableOpacity
            onPress={onPress}>
            <Image source={require('./resources/white_button_more.png')} />
        </TouchableOpacity>
    </View>)
}
