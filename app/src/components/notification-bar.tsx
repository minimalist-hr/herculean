import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { AlertIcon, CheckIcon } from './icons';
import {
  dismissNotification,
  useNotification,
  useNotificationInset,
} from './notifications';
import { useReduceMotion } from './use-reduce-motion';

/** Shows the latest notification above whatever is at the bottom of the screen. */
export function NotificationBar() {
  const { colors, motion, radius, size, space, text } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const notification = useNotification();
  const actionBoxHeight = useNotificationInset();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  // It stays on the screen after it is dismissed, until it has gone down.
  const [shown, setShown] = useState(notification);
  if (notification !== null && notification !== shown) {
    setShown(notification);
  }

  useEffect(() => {
    const showing = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hiding = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showing.remove();
      hiding.remove();
    };
  }, []);

  useEffect(() => {
    if (shown === null) {
      return;
    }

    const visible = notification !== null;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : motion.sheetMs,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      // The web has no native animation driver.
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setShown(null);
      }
    });

    return () => {
      animation.stop();
    };
  }, [motion.sheetMs, notification, progress, reduceMotion, shown]);

  useEffect(() => {
    if (notification === null) {
      return;
    }

    const timer = setTimeout(
      dismissNotification,
      notification.kind === 'success'
        ? motion.notificationSuccessMs
        : motion.notificationFailureMs,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [motion, notification]);

  if (shown === null) {
    return null;
  }

  const { tabBar } = size;
  const tabBarHeight =
    tabBar.paddingTop +
    size.tabItem +
    Math.max(insets.bottom, tabBar.paddingBottomMin);
  const cleared =
    keyboardHeight > 0 ? keyboardHeight : (actionBoxHeight ?? tabBarHeight);

  return (
    <Animated.View
      testID="notification-bar"
      style={[
        styles.position,
        {
          left: size.sidePadding,
          right: size.sidePadding,
          bottom: cleared + space.md,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [size.notificationMin, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={dismissNotification}
        style={[
          styles.bar,
          {
            gap: space.md,
            minHeight: size.notificationMin,
            paddingVertical: 10,
            paddingHorizontal: space.lg,
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.raised,
          },
        ]}
      >
        {shown.kind === 'success' ? (
          <CheckIcon color={colors.success} size={20} />
        ) : (
          <AlertIcon color={colors.danger} size={20} />
        )}
        <Text
          style={[text.notification, styles.message, { color: colors.text }]}
        >
          {shown.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  message: {
    flex: 1,
  },
});
