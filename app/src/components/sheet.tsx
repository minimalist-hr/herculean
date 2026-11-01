import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { CloseIcon } from './icons';
import { useKeyboardHeight } from './use-keyboard-height';
import { useReduceMotion } from './use-reduce-motion';

const paddingBottomMin = 34;

interface SheetProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** What sits between the heading and the actions, for example a field. */
  body?: ReactNode;
  /** The actions below the line: the main one first. */
  children: ReactNode;
}

/** A sheet rising over a dimmed screen. It closes back to the screen that opened it. */
export function Sheet({
  visible,
  title,
  message,
  onClose,
  body,
  children,
}: SheetProps) {
  const { colors, motion, radius, size, space, text } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const keyboardHeight = useKeyboardHeight();
  const window = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  // Until it is measured, the whole window is sure to start it out of sight.
  const [sheetHeight, setSheetHeight] = useState(window.height);
  // It stays open after visible turns false, until it has gone down.
  const [open, setOpen] = useState(visible);
  if (visible && !open) {
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : motion.sheetMs,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      // The web has no native animation driver.
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setOpen(false);
      }
    });

    return () => {
      animation.stop();
    };
  }, [motion.sheetMs, open, progress, reduceMotion, visible]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: progress, backgroundColor: colors.scrim },
        ]}
      />
      <KeyboardAvoidingView behavior="padding" style={styles.outside}>
        <Pressable
          accessibilityLabel="Close"
          style={styles.outside}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          onLayout={(event) => {
            setSheetHeight(event.nativeEvent.layout.height);
          }}
          style={[
            styles.sheet,
            {
              gap: space.lg,
              paddingTop: space.sm,
              // The keyboard covers the phone's bottom edge, so the sheet needs no room for it then.
              paddingBottom:
                keyboardHeight > 0
                  ? space.lg
                  : Math.max(insets.bottom + space.md, paddingBottomMin),
              borderTopLeftRadius: radius.sheetTop,
              borderTopRightRadius: radius.sheetTop,
              borderTopColor: colors.border,
              backgroundColor: colors.card,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [sheetHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.grabber,
              {
                width: size.sheetGrabber.width,
                height: size.sheetGrabber.height,
                backgroundColor: colors.border,
              },
            ]}
          />
          <View
            style={[
              styles.heading,
              { gap: space.md, paddingHorizontal: size.sidePadding },
            ]}
          >
            <View style={styles.headingText}>
              <Text
                accessibilityRole="header"
                style={[text.cardTitle, { color: colors.text }]}
              >
                {title}
              </Text>
              <Text style={text.meta}>{message}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={[
                styles.close,
                {
                  width: size.touchTargetMin,
                  height: size.touchTargetMin,
                },
              ]}
            >
              <CloseIcon color={colors.muted} size={20} />
            </Pressable>
          </View>
          {body !== undefined && (
            <View style={{ paddingHorizontal: size.sidePadding }}>{body}</View>
          )}
          <View
            style={[
              styles.actions,
              {
                gap: size.gap.stackedButtons,
                paddingTop: space.lg,
                paddingHorizontal: size.sidePadding,
                borderTopColor: colors.border,
              },
            ]}
          >
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outside: {
    flex: 1,
  },
  sheet: {
    borderTopWidth: 1,
  },
  grabber: {
    alignSelf: 'center',
    borderRadius: 999,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headingText: {
    flex: 1,
    gap: 4,
  },
  // The icon lines up with the edge. The rest of its touch target hangs over the padding.
  close: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginRight: -8,
  },
  actions: {
    borderTopWidth: 1,
  },
});
