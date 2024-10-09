import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    Animated,
    PanResponder,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import ZegoUIKit, { ZegoAudioVideoView } from '@zegocloud/zego-uikit-rn';
import MinimizingHelper from "./services/minimizing_helper";
import { zloginfo } from "../utils/logger";
import PrebuiltHelper from './services/prebuilt_helper';

export default function ZegoUIKitPrebuiltCallFloatingMinimizedView(props: any) {
    const window = useWindowDimensions();
    const {
        width = 90,
        height = 160,
        borderRadius = 10,
        left = window.width / 2 || 100,
        top = 10,
        showSoundWaveInAudioMode = true,
        useVideoViewAspectFill = true,
    } = props;
    const [isInit, setIsInit] = useState(false);
    const [isVisable, setIsVisable] = useState(false);
    const [layout, setLayout] = useState({
        left,
        top,
    });
    const [floatViewInfo, setFloatViewInfo] = useState({
        width: 0, height: 0,
    });
    const [activeUserID, setActiveUserID] = useState('');
    const [isMoving, setIsMoving] = useState(false);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => {
            zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onPanResponderGrant gestureState', gestureState);
            setIsMoving(false);
        },
        onPanResponderMove: (evt, gestureState) => {
            // zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onPanResponderMove layout', layout);
            // zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onPanResponderMove gestureState', gestureState);
            if (
                Math.abs(gestureState.dx) < 5 &&
                Math.abs(gestureState.dy) < 5 &&
                !isMoving
            ) {
                setIsMoving(false);
            } else {
                setIsMoving(true);
                const newLeft = layout.left + gestureState.dx;
                const newTop = layout.top + gestureState.dy;
                if (newLeft >= (window.width - floatViewInfo.width) || newTop >= (window.height - floatViewInfo.height) || newLeft <= 0 || newTop <= 0) return;
                setLayout({
                    left: newLeft,
                    top: newTop,
                });
            }
        },
        onPanResponderEnd: (evt, gestureState) => {
            zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onPanResponderEnd layout', layout);
            zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onPanResponderEnd gestureState', gestureState);
        },
        onPanResponderRelease: () => {
            if (!isMoving) {
                // Click
                pressedHandle();
            }
            setIsMoving(false);
        },
    });

    const callbackID = 'ZegoMinimizeRoom' + String(Math.floor(Math.random() * 10000));

    const layoutHandle = useCallback((e) => {
        const  { x, y, width, height } = e.nativeEvent.layout;
        zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] layoutHandle', x, y, width, height);
        setFloatViewInfo({ width, height });
    }, []);
    const pressedHandle = async () => {
        zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] pressedHandle');
        MinimizingHelper.getInstance().notifyMaximize();
    }

    useEffect(() => {
        MinimizingHelper.getInstance().onPrebuiltInit(callbackID, () => {
            zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] init success');
            setIsInit(true);
        });
        return () => {
            MinimizingHelper.getInstance().onPrebuiltInit(callbackID);
        };
    }, []);
    useEffect(() => {
        if (isInit) {
            MinimizingHelper.getInstance().onWindowMinimized(callbackID, () => {
                setIsVisable(true);
                const initConfig = MinimizingHelper.getInstance().getInitConfig();
                const { onWindowMinimized } = initConfig;

                if (typeof onWindowMinimized === 'function') {
                    onWindowMinimized();
                    MinimizingHelper.getInstance().setIsMinimizeSwitch(true);
                    setTimeout(() => {
                        ZegoUIKit.forceRenderVideoView();
                    }, 100);
                }
            });
            MinimizingHelper.getInstance().onWindowMaximized(callbackID, () => {
                setIsVisable(false);
                const initConfig = MinimizingHelper.getInstance().getInitConfig();
                const { onWindowMaximized } = initConfig;

                if (typeof onWindowMaximized === 'function') {
                    onWindowMaximized();
                    MinimizingHelper.getInstance().setIsMinimizeSwitch(true);
                }
            });
            MinimizingHelper.getInstance().onEntryNormal(callbackID, () => {
                setIsVisable(false);
            });
            MinimizingHelper.getInstance().onActiveUserIDUpdate(callbackID, (activeUserID) => {
                // zloginfo(`[ZegoUIKitPrebuiltCallFloatingMinimizedView] onActiveUserIDUpdate`, activeUserID);
                setActiveUserID(activeUserID);
            });
        }
        return () => {
            MinimizingHelper.getInstance().onWindowMinimized(callbackID);
            MinimizingHelper.getInstance().onWindowMaximized(callbackID);
            MinimizingHelper.getInstance().onEntryNormal(callbackID);
            MinimizingHelper.getInstance().onActiveUserIDUpdate(callbackID);
        }
    }, [isInit]);

    useEffect(() => {
      ZegoUIKit.onOnlySelfInRoom(callbackID, () => {
        zloginfo('[ZegoUIKitPrebuiltCallFloatingMinimizedView] onOnlySelfInRoom')
        const isMinimize = MinimizingHelper.getInstance().getIsMinimize();
        isMinimize && PrebuiltHelper.getInstance().notifyDestroyPrebuilt();
      })
    }, [])
    return (
        <Animated.View
            style={[
                { position: 'absolute', left: layout.left, top: layout.top },
                { display: isVisable ? 'flex' : 'none' },
            ]}
            onLayout={layoutHandle}
            {...panResponder.panHandlers}
        >
            <View
                style={[
                    styles.floatAudioView,
                    {
                        width,
                        height,
                        borderRadius,
                    }
                ]}
            >
                {
                    activeUserID ? <ZegoAudioVideoView
                        key={activeUserID}
                        userID={activeUserID}
                        useVideoViewAspectFill={useVideoViewAspectFill}
                        showSoundWave={showSoundWaveInAudioMode}
                    /> : <View />
                }
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    floatAudioView: {
        overflow: 'hidden',
        zIndex: 10000,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 8
    },
});
