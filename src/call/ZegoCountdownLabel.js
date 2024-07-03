import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { durationFormat } from "../utils";
import TimingHelper, { } from "../services/timing_helper"

export default function ZegoCountdownLabel(props) {
    const { maxDuration, onCountdownFinished } = props;
    const [duration, setDuration] = useState(Math.max(maxDuration - TimingHelper.getInstance().getDuration(), 0));
    const [countdownFinished, setCountdownFinished] = useState(false);
    useEffect(() => {
        TimingHelper.getInstance().onDurationUpdate("ZegoCountdownLabelDuration", (v) => {
            if (v == maxDuration) {
                if (typeof onCountdownFinished === "function") {
                    onCountdownFinished()
                }
            }
             else if (v > maxDuration) return;
            
            setDuration(Math.max(maxDuration - v, 0))
        });
    }, [])
    return (
        <View style={styles.container} pointerEvents={'box-none'}>
            <SafeAreaView ><Text style={styles.timing}>{durationFormat(duration)}</Text></SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 26,
        zIndex: 5,
        alignItems: 'center',
    },
    timing: {
        color: 'white',
    },
});