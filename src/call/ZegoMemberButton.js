import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ZegoMemberButton(props) {
    const { onPress } = props;

    return (<View style={styles.full}>
        <TouchableOpacity 
            onPress={onPress}
            style={styles.full}>
            <Image
                style={styles.full}
                source={require('./resources/white_button_members.png')}
            />
        </TouchableOpacity>
    </View>);
}

const styles = StyleSheet.create({
    full: {
        width: '100%',
        height: '100%',
    },
});