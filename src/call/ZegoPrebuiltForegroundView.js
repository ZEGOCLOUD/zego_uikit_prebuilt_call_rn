import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView ,Platform, StatusBar} from 'react-native';
import { durationFormat } from "../utils";
import TimingHelper, { } from "../services/timing_helper"

export default function ZegoPrebuiltForegroundView(props) {
    const { isDurationVisible } = props;
    const [duration, setDuration] = useState(TimingHelper.getInstance().getDuration());
    useEffect(() => {
        TimingHelper.getInstance().onDurationUpdate("ZegoPrebuiltForegroundViewDuration", (duration) => setDuration(duration));
    }, [])

    return (
        <View style={styles.container}>
            {isDurationVisible ? <SafeAreaView ><Text style={styles.timing}>{durationFormat(duration)}</Text></SafeAreaView> : null}
        </View>
    );
}

const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight : 26

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: paddingTop,
        zIndex: 5,
        alignItems: 'center',
    },
    timing: {
        color: 'white',
    },
});
