import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme/theme-provider';

import { CloseIcon } from './icons';
import { NotificationBar } from './notification-bar';
import {
  dismissFailure,
  sheetClosed,
  sheetOpened,
  useTopSheet,
} from './notifications';
import { closesAfterDrag } from './sheet-drag';
import { useKeyboardHeight } from './use-keyboard-height';
import { useReduceMotion } from './use-reduce-motion';
import { Tappable } from './tappable';

const paddingBottomMin = 34;

const easing = Easing.bezier(0.33, 1, 0.68, 1);

function settle(value: SharedValue<number>, toValue: number) {
  value.set(withTiming(toValue, { duration: 180, easing }));
}

interface SheetProps {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  /** It always takes all the room, and the body fills it and scrolls by itself, for a long list. */
  fill?: boolean;
  /** Turn off while something in the body is being dragged. */
  scrollEnabled?: boolean;
  /** What sits between the heading and the actions, for example a field. It scrolls if it doesn't fit. */
  body?: ReactNode;
  /** The actions below the line: the main one first. The close button and a tap outside cancel. */
  children: ReactNode;
}

/** A sheet rising over a dimmed screen. It closes back to the screen that opened it, and pulling the grabber down closes it. */
export function Sheet({
  visible,
  title,
  message,
  onClose,
  fill = false,
  scrollEnabled = true,
  body,
  children,
}: SheetProps) {
  const { colors, motion, radius, size, space, text } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const keyboardHeight = useKeyboardHeight();
  const window = useWindowDimensions();
  const progress = useSharedValue(0);
  const pulledDown = useSharedValue(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);
  const [actionsHeight, setActionsHeight] = useState(0);
  // It stays open after visible turns false, until it has gone down.
  const [open, setOpen] = useState(visible);
  if (visible && !open) {
    setOpen(true);
  }

  const paddingTop = space.sm;
  const paddingBottom =
    // The keyboard covers the phone's bottom edge, so the sheet needs no room for it then.
    keyboardHeight > 0
      ? space.lg
      : Math.max(insets.bottom + space.md, paddingBottomMin);
  // The actions wait behind the keyboard, so the fields keep the room.
  const actionsShown = keyboardHeight === 0;
  const parts = 1 + (body === undefined ? 0 : 1) + (actionsShown ? 1 : 0);
  const natural =
    paddingTop +
    headingHeight +
    (bodyHeight ?? 0) +
    (actionsShown ? actionsHeight : 0) +
    paddingBottom +
    space.lg * (parts - 1);
  const measured =
    headingHeight > 0 &&
    (actionsHeight > 0 || !actionsShown) &&
    (fill || body === undefined || bodyHeight !== null);
  const full = window.height - insets.top - keyboardHeight;
  // It is as small as its content allows. Content that doesn't fit gets all the room there is, and scrolls.
  const shownHeight = fill ? full : Math.min(natural, full);
  const startingOffset = measured ? shownHeight : window.height;

  // Some notifications show above the sheet while it is open. One going down has made way already.
  const id = useId();
  const isTop = useTopSheet(id);
  useEffect(() => {
    if (!visible) {
      return;
    }

    sheetOpened(id);

    return () => {
      sheetClosed(id);
    };
  }, [id, visible]);

  useEffect(() => {
    if (!visible) {
      dismissFailure();
    }
  }, [visible]);

  useEffect(() => {
    // It rises only once its height is known, or the distance changes on the way up and the motion jumps.
    if (!open || (visible && !measured)) {
      return;
    }

    if (visible) {
      pulledDown.set(0);
    }

    progress.set(
      withTiming(
        visible ? 1 : 0,
        { duration: reduceMotion ? 0 : motion.sheetMs, easing },
        (finished) => {
          if (finished === true && !visible) {
            scheduleOnRN(setOpen, false);
          }
        },
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [
    measured,
    motion.sheetMs,
    open,
    progress,
    pulledDown,
    reduceMotion,
    visible,
  ]);

  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({ shownHeight, onClose });
  useEffect(() => {
    latest.current = { shownHeight, onClose };
  });

  const pull = useRef(0);

  const movePull = useCallback(
    (distance: number) => {
      pull.current = Math.max(0, distance);
      pulledDown.set(pull.current);
    },
    [pulledDown],
  );

  const endPull = useCallback(
    (velocity: number) => {
      const closes = closesAfterDrag({
        height: latest.current.shownHeight,
        pulledDown: pull.current,
        velocity,
      });
      if (closes) {
        latest.current.onClose();
      } else {
        settle(pulledDown, 0);
      }
    },
    [pulledDown],
  );

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const riseStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * startingOffset }],
  }));
  const pullStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pulledDown.get() }],
  }));

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
          { backgroundColor: colors.scrim },
          scrimStyle,
        ]}
      />
      <KeyboardAvoidingView behavior="padding" style={styles.outside}>
        <Tappable
          feedback="none"
          accessibilityLabel="Close"
          style={styles.outside}
          onPress={onClose}
        />
        <Animated.View style={riseStyle}>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                gap: space.lg,
                maxHeight: full,
                paddingTop,
                paddingBottom,
                borderTopLeftRadius: radius.sheetTop,
                borderTopRightRadius: radius.sheetTop,
                borderTopColor: colors.border,
                backgroundColor: colors.card,
              },
              measured && { height: shownHeight },
              pullStyle,
            ]}
          >
            <DragArea
              onMove={movePull}
              onEnd={endPull}
              onHeight={setHeadingHeight}
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
                  {message !== undefined && (
                    <Text style={text.meta}>{message}</Text>
                  )}
                </View>
                <Tappable
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
                </Tappable>
              </View>
            </DragArea>
            {fill && <View style={styles.fillBody}>{body}</View>}
            {!fill && body !== undefined && (
              <ScrollView
                scrollEnabled={scrollEnabled}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                style={styles.body}
                onContentSizeChange={(_width, contentHeight) => {
                  setBodyHeight(contentHeight);
                }}
                contentContainerStyle={{ paddingHorizontal: size.sidePadding }}
              >
                {body}
              </ScrollView>
            )}
            <View
              testID="sheet-actions"
              onLayout={(event) => {
                // Hidden, it measures nothing, and the last height still holds for when it comes back.
                if (event.nativeEvent.layout.height > 0) {
                  setActionsHeight(event.nativeEvent.layout.height);
                }
              }}
              style={[
                styles.actions,
                !actionsShown && styles.hidden,
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
        </Animated.View>
      </KeyboardAvoidingView>
      {isTop && <NotificationBar inSheet />}
    </Modal>
  );
}

interface DragAreaProps {
  onMove: (distance: number) => void;
  onEnd: (velocity: number) => void;
  onHeight: (height: number) => void;
  children: ReactNode;
}

/** The top of a sheet, which pulls it down. A tap still reaches what is inside. */
function DragArea({ onMove, onEnd, onHeight, children }: DragAreaProps) {
  const { space } = useTheme();
  const drag = useMemo(
    () =>
      PanResponder.create({
        // A touch on the close button goes to that button, which sits deeper.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_event, gesture) => {
          onMove(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          onEnd(gesture.vy);
        },
      }),
    [onEnd, onMove],
  );

  return (
    <View
      {...drag.panHandlers}
      testID="sheet-drag"
      onLayout={(event) => {
        onHeight(event.nativeEvent.layout.height);
      }}
      style={{ gap: space.lg }}
    >
      {children}
    </View>
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
  body: {
    flexShrink: 1,
  },
  fillBody: {
    flex: 1,
  },
  actions: {
    borderTopWidth: 1,
  },
  hidden: {
    display: 'none',
  },
});
