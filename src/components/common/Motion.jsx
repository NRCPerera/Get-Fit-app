import React, { useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, AppState, Text, TouchableOpacity } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { pressAnimationStyle } from '../../styles/shared';

// Shared controls also work outside a navigator (for example, startup screens).
export function useMotionEnabled() {
  const navigation = useContext(NavigationContext);
  const subscribe = useCallback(callback => {
    const focus = navigation?.addListener('focus', callback);
    const blur = navigation?.addListener('blur', callback);
    return () => { focus?.(); blur?.(); };
  }, [navigation]);
  const getSnapshot = useCallback(() => navigation?.isFocused() ?? true, [navigation]);
  const focused = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReduced(value); })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const app = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  return focused && active && !reduced;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function ScaleTouchable({ style, onPressIn, onPressOut, disabled, ...props }) {
  const enabled = useMotionEnabled();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = value => Animated.spring(scale, {
    toValue: value, speed: 28, bounciness: 2, useNativeDriver: true, isInteraction: false,
  }).start();
  useEffect(() => {
    if (!enabled || disabled) scale.setValue(1);
    return () => scale.stopAnimation();
  }, [enabled, disabled, scale]);

  return <AnimatedTouchable {...props} disabled={disabled} style={[style, pressAnimationStyle(scale)]}
    onPressIn={event => { if (enabled && !disabled) animate(0.97); onPressIn?.(event); }}
    onPressOut={event => { animate(1); onPressOut?.(event); }} />;
}

export function MotionView({ children, style, pulse = false, delay = 0, ...props }) {
  const enabled = useMotionEnabled();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!enabled) { progress.setValue(1); return; }
    progress.setValue(0);
    const timing = toValue => Animated.timing(progress, {
      toValue, duration: pulse ? 1400 : 420, delay: pulse ? 0 : delay,
      useNativeDriver: true, isInteraction: false,
    });
    const animation = pulse ? Animated.loop(Animated.sequence([timing(1), timing(0)])) : timing(1);
    animation.start();
    return () => animation.stop();
  }, [enabled, pulse, delay, progress]);

  return <Animated.View {...props} style={[style, enabled && {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [pulse ? 0.65 : 0, 1] }),
    transform: pulse
      ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) }]
      : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  }]}>{children}</Animated.View>;
}

export function FocusSurface({ children, style, ...props }) {
  const enabled = useMotionEnabled();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = value => Animated.timing(scale, {
    toValue: enabled ? value : 1, duration: 180, useNativeDriver: true, isInteraction: false,
  }).start();
  useEffect(() => {
    if (!enabled) scale.setValue(1);
    return () => scale.stopAnimation();
  }, [enabled, scale]);

  return <Animated.View {...props} style={[style, { transform: [{ scale }] }]}>
    {React.Children.map(children, child => React.isValidElement(child) && child.props.onChangeText
      ? React.cloneElement(child, {
        onFocus: event => { animate(1.015); child.props.onFocus?.(event); },
        onBlur: event => { animate(1); child.props.onBlur?.(event); },
      }) : child)}
  </Animated.View>;
}

export function CountUpText({ value, ...props }) {
  const enabled = useMotionEnabled();
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!enabled) { setDisplay(value); return; }
    const match = String(value).match(/^(\d+)(.*)$/);
    if (!match) { setDisplay(value); return; }
    const counter = new Animated.Value(0);
    const listener = counter.addListener(({ value: current }) => setDisplay(`${Math.round(current)}${match[2]}`));
    const animation = Animated.timing(counter, {
      toValue: Number(match[1]), duration: 650, useNativeDriver: false, isInteraction: false,
    });
    animation.start();
    return () => { animation.stop(); counter.removeListener(listener); };
  }, [value, enabled]);
  return <Text {...props} accessibilityLabel={String(value)}>{display}</Text>;
}
