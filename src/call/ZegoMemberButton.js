import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ZegoMemberButton(props) {
    const { onPress } = props;

    return (<View>
        <TouchableOpacity 
            onPress={onPress}>
            <Image
                source={require('./resources/white_button_members.png')}
            />
        </TouchableOpacity>
    </View>);
}
