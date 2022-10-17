import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ZegoMemberButton(props) {
    const { onPressed } = props;

    return (<View>
        <TouchableOpacity 
            onPress={onPressed}>
            <Image
                source={require('./resources/white_button_members.png')}
            />
        </TouchableOpacity>
    </View>);
}
