import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { useReduceMotion } from '@/components/use-reduce-motion';
import { useTheme } from '@/theme/theme-provider';

import { isSidewaysSwipe, pageAfterSwipe } from './page-swipe';

const easing = Easing.bezier(0.33, 1, 0.68, 1);
/** Small enough to sit in the side padding, so the hint takes no room. */
const hintSize = 12;
/** How far a page follows the finger when there is no page that way. */
const endResistance = 0.2;

interface Page {
  /** Sorts by time, so a later page has a greater key. */
  key: string;
  content: ReactNode;
}

interface SwipePagerProps {
  previous: Page;
  current: Page;
  next: Page;
  canGoBack: boolean;
  canGoForward: boolean;
  /** 1 is the next page, and -1 the previous. */
  onChange: (direction: number) => void;
  testID: string;
}

/** Pages that follow a sideways swipe across the screen's width, with a small chevron on each side that has a page. The two beside the current one wait ready. */
export function SwipePager({
  previous,
  current,
  next,
  canGoBack,
  canGoForward,
  onChange,
  testID,
}: SwipePagerProps) {
  const { colors, motion, size } = useTheme();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const offset = useSharedValue(0);

  const previousKey = useRef(current.key);
  const swiped = useRef(false);

  useLayoutEffect(() => {
    if (previousKey.current === current.key) {
      return;
    }

    const cameFromLater = current.key < previousKey.current;
    previousKey.current = current.key;

    // A swipe has slid here already, so it goes back to the middle in the same commit and the page doesn't jump.
    if (swiped.current || reduceMotion) {
      swiped.current = false;
      offset.set(0);
      return;
    }

    // Anything else, like a button, slides in from the side the new page lies on.
    offset.set(cameFromLater ? -width : width);
    offset.set(withTiming(0, { duration: motion.sheetMs, easing }));
  }, [current.key, motion.sheetMs, offset, reduceMotion, width]);

  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({
    canGoBack,
    canGoForward,
    onChange,
    reduceMotion,
    sheetMs: motion.sheetMs,
    width,
  });
  useLayoutEffect(() => {
    latest.current = {
      canGoBack,
      canGoForward,
      onChange,
      reduceMotion,
      sheetMs: motion.sheetMs,
      width,
    };
  });

  const change = useCallback((direction: number) => {
    swiped.current = true;
    latest.current.onChange(direction);
  }, []);

  const settle = useCallback(
    (toValue: number, direction: number) => {
      if (latest.current.reduceMotion) {
        offset.set(toValue);
        if (direction !== 0) {
          change(direction);
        }
        return;
      }

      offset.set(
        withTiming(
          toValue,
          { duration: latest.current.sheetMs, easing },
          (finished) => {
            if (finished === true && direction !== 0) {
              scheduleOnRN(change, direction);
            }
          },
        ),
      );
    },
    [change, offset],
  );

  const moveSwipe = useCallback(
    (distance: number) => {
      const blocked =
        distance > 0 ? !latest.current.canGoBack : !latest.current.canGoForward;
      offset.set(blocked ? distance * endResistance : distance);
    },
    [offset],
  );

  const endSwipe = useCallback(
    (distance: number, velocity: number) => {
      const direction = pageAfterSwipe({
        distance,
        velocity,
        width: latest.current.width,
      });
      const allowed =
        direction > 0 ? latest.current.canGoForward : latest.current.canGoBack;
      if (direction === 0 || !allowed) {
        settle(0, 0);
      } else {
        settle(-direction * latest.current.width, direction);
      }
    },
    [settle],
  );

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  function renderPage(page: Page, position: number) {
    const shown = position === 0;

    return (
      <View
        key={page.key}
        accessibilityElementsHidden={!shown}
        importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
        style={[
          { width, paddingHorizontal: size.sidePadding },
          !shown && [styles.sidePage, { left: position * width }],
        ]}
      >
        {page.content}
      </View>
    );
  }

  return (
    <SwipeArea testID={testID} onMove={moveSwipe} onEnd={endSwipe}>
      <Animated.View style={[{ width }, slideStyle]}>
        {renderPage(previous, -1)}
        {renderPage(current, 0)}
        {renderPage(next, 1)}
      </Animated.View>
      {canGoBack && (
        <View
          testID={`${testID}-back-hint`}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.hint, styles.hintBack]}
        >
          <ChevronLeftIcon color={colors.muted} size={hintSize} />
        </View>
      )}
      {canGoForward && (
        <View
          testID={`${testID}-forward-hint`}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.hint, styles.hintForward]}
        >
          <ChevronRightIcon color={colors.muted} size={hintSize} />
        </View>
      )}
    </SwipeArea>
  );
}

function SwipeArea({
  testID,
  onMove,
  onEnd,
  children,
}: {
  testID: string;
  onMove: (distance: number) => void;
  onEnd: (distance: number, velocity: number) => void;
  children: ReactNode;
}) {
  const { size } = useTheme();
  const swipe = useMemo(
    () =>
      PanResponder.create({
        // A tap goes to what is under it, which sits deeper. Only a sideways move takes over.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: (_event, { dx, dy }) =>
          isSidewaysSwipe(dx, dy),
        onPanResponderMove: (_event, { dx }) => {
          onMove(dx);
        },
        onPanResponderRelease: (_event, { dx, vx }) => {
          onEnd(dx, vx);
        },
        onPanResponderTerminate: () => {
          onEnd(0, 0);
        },
      }),
    [onEnd, onMove],
  );

  return (
    <View
      testID={testID}
      {...swipe.panHandlers}
      style={[styles.pager, { marginHorizontal: -size.sidePadding }]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pager: {
    overflow: 'hidden',
  },
  sidePage: {
    position: 'absolute',
    top: 0,
  },
  hint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hintBack: {
    left: 2,
  },
  hintForward: {
    right: 2,
  },
});
