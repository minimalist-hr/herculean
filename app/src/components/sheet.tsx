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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  GestureDetector,
  GestureHandlerRootView,
  useNativeGesture,
  usePanGesture,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';
import { motionEasing } from '@/theme/motion';

import { Frosted, useSurfaceColor } from './frosted';
import { CloseIcon } from './icons';
import { NotificationBar } from './notification-bar';
import {
  dismissFailure,
  sheetClosed,
  sheetDown,
  sheetOpened,
  sheetSinking,
  useSinkRequests,
  useTopSheet,
} from './notifications';
import { closesAfterDrag } from './sheet-drag';
import { useKeyboardHeight } from './use-keyboard-height';
import { useReduceMotion } from './use-reduce-motion';
import { Tappable } from './tappable';

const paddingBottomMin = 34;
const borderTop = 1;
const bodyPullStartsAfter = 8;
const millisecondsInSecond = 1000;

function settle(value: SharedValue<number>, toValue: number) {
  'worklet';
  value.set(
    withTiming(toValue, {
      duration: tokens.motion.fastMs,
      easing: motionEasing,
    }),
  );
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
  /** The space between the heading and the body, when it isn't the usual one. */
  bodyGap?: number;
  /** Says how many points the content is over the room there is, so a body can shrink to fit. */
  onOverflow?: (points: number) => void;
  /** Keeps the actions above the keyboard, for a short form whose action should stay in reach. */
  actionsAboveKeyboard?: boolean;
  /** The actions below the line: the main one first. The close button and a tap outside cancel. A sheet of choices in its body has none. */
  children?: ReactNode;
}

/** A sheet rising over a dimmed screen. It closes back to the screen that opened it, and pulling the grabber down closes it. */
export function Sheet({
  visible: wanted,
  title,
  message,
  onClose,
  fill = false,
  scrollEnabled = true,
  body,
  bodyGap,
  onOverflow,
  actionsAboveKeyboard = false,
  children,
}: SheetProps) {
  const { colors, line, motion, radius, size, space, text } = useTheme();
  const surface = useSurfaceColor(colors.card);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const keyboardHeight = useKeyboardHeight();
  const window = useWindowDimensions();
  const progress = useSharedValue(0);
  const pulledDown = useSharedValue(0);
  const [headingHeight, setHeadingHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);
  const [actionsHeight, setActionsHeight] = useState(0);
  // An action that leaves the page asks every open sheet to go down first, so it slides away instead of vanishing.
  const sinkRequests = useSinkRequests();
  const [wasWanted, setWasWanted] = useState(wanted);
  const [openedAt, setOpenedAt] = useState(sinkRequests);
  if (wanted !== wasWanted) {
    setWasWanted(wanted);
    if (wanted) {
      setOpenedAt(sinkRequests);
    }
  }
  const visible = wanted && sinkRequests === openedAt;

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
  const actionsShown =
    children !== undefined && (keyboardHeight === 0 || actionsAboveKeyboard);
  const parts = 1 + (body === undefined ? 0 : 1) + (actionsShown ? 1 : 0);
  const bodyPull = bodyGap === undefined ? 0 : bodyGap - space.lg;
  const natural =
    borderTop +
    paddingTop +
    headingHeight +
    (bodyHeight ?? 0) +
    (actionsShown ? actionsHeight : 0) +
    paddingBottom +
    space.lg * (parts - 1) +
    bodyPull;
  const measured =
    headingHeight > 0 &&
    (actionsHeight > 0 || !actionsShown) &&
    (fill || body === undefined || bodyHeight !== null);
  const full = window.height - insets.top - keyboardHeight;
  // It is as small as its content allows. Content that doesn't fit gets all the room there is, and scrolls.
  const shownHeight = fill ? full : Math.min(natural, full);
  const startingOffset = measured ? shownHeight : window.height;

  useEffect(() => {
    if (measured && natural > full) {
      onOverflow?.(natural - full);
    }
  }, [measured, natural, full, onOverflow]);

  // Some notifications show above the sheet while it is open. One going down has made way already.
  const id = useId();
  const isTop = useTopSheet(id);
  useEffect(() => {
    if (!visible) {
      return;
    }

    sheetOpened(id);

    return () => {
      sheetSinking(id);
      sheetClosed(id);
    };
  }, [id, visible]);

  // A sheet leaving with its page is down too, so nothing waits for it.
  useEffect(
    () => () => {
      sheetDown(id);
    },
    [id],
  );

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
        {
          duration: reduceMotion ? 0 : motion.standardMs,
          easing: motionEasing,
        },
        (finished) => {
          if (finished === true && !visible) {
            scheduleOnRN(setOpen, false);
            scheduleOnRN(sheetDown, id);
          }
        },
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [
    id,
    measured,
    motion.standardMs,
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

  // Gone down for an action, it tells its screen it is closed, so it can open again later.
  const sunk = wanted && !visible;
  useEffect(() => {
    if (sunk) {
      latest.current.onClose();
    }
  }, [sunk]);

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
        settle(pulledDown, latest.current.shownHeight);
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
  const closeFromBody = useCallback(() => {
    latest.current.onClose();
  }, []);

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
      <GestureHandlerRootView style={styles.gestureRoot}>
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
                  backgroundColor: surface,
                },
                measured && { height: shownHeight },
                pullStyle,
              ]}
            >
              <Frosted
                color={colors.card}
                corners={{
                  borderTopLeftRadius: radius.sheetTop,
                  borderTopRightRadius: radius.sheetTop,
                }}
              />
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
                <SheetBody
                  pulledDown={pulledDown}
                  height={shownHeight}
                  onClose={closeFromBody}
                  marginTop={bodyPull}
                  onHeight={setBodyHeight}
                  scrollEnabled={scrollEnabled}
                >
                  {body}
                </SheetBody>
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
                    borderTopWidth: line,
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
      </GestureHandlerRootView>
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
/** The scrolling body. A pull down moves the sheet once the body is at its top. It runs on the native side and off the JavaScript thread, because a scroll view takes a touch before JavaScript can ask for it, and so the sheet stays under the finger. */
function SheetBody({
  pulledDown,
  height,
  onClose,
  marginTop,
  onHeight,
  scrollEnabled,
  children,
}: {
  pulledDown: SharedValue<number>;
  height: number;
  marginTop: number;
  onClose: () => void;
  onHeight: (height: number) => void;
  scrollEnabled: boolean;
  children: ReactNode;
}) {
  const { size } = useTheme();
  const atTop = useSharedValue(true);
  const pullStart = useSharedValue<number | null>(null);
  const scroll = useNativeGesture({});
  const pull = usePanGesture({
    testID: 'sheet-body',
    activeOffsetY: bodyPullStartsAfter,
    failOffsetY: -bodyPullStartsAfter,
    simultaneousWith: scroll,
    onUpdate: ({ translationY }) => {
      'worklet';
      if (pullStart.get() === null && atTop.get() && scrollEnabled) {
        pullStart.set(translationY);
      }
      const start = pullStart.get();
      if (start !== null) {
        pulledDown.set(Math.max(0, translationY - start));
      }
    },
    onDeactivate: ({ velocityY }) => {
      'worklet';
      if (pullStart.get() !== null) {
        const closes = closesAfterDrag({
          height,
          pulledDown: pulledDown.get(),
          velocity: velocityY / millisecondsInSecond,
        });
        // It keeps moving at once, because the screen behind can take a moment to answer a close.
        settle(pulledDown, closes ? height : 0);
        if (closes) {
          scheduleOnRN(onClose);
        }
      }
      pullStart.set(null);
    },
  });

  return (
    <GestureDetector gesture={pull}>
      <View collapsable={false} style={[styles.body, { marginTop }]}>
        <GestureDetector gesture={scroll}>
          <ScrollView
            scrollEnabled={scrollEnabled}
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            onScroll={(event) => {
              atTop.set(event.nativeEvent.contentOffset.y <= 0);
            }}
            onContentSizeChange={(_width, contentHeight) => {
              onHeight(contentHeight);
            }}
            contentContainerStyle={{ paddingHorizontal: size.sidePadding }}
          >
            {children}
          </ScrollView>
        </GestureDetector>
      </View>
    </GestureDetector>
  );
}

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
  gestureRoot: {
    flex: 1,
  },
  outside: {
    flex: 1,
  },
  sheet: {
    borderTopWidth: borderTop,
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
    gap: tokens.space.xxs,
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
  actions: {},
  hidden: {
    display: 'none',
  },
});
