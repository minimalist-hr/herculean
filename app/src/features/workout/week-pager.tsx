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

import { addDays, dateText, weekOf } from './dates';
import { useDays } from './use-days';
import { WeekStrip } from './week-strip';
import { weekAfterSwipe } from './week-swipe';

const easing = Easing.bezier(0.33, 1, 0.68, 1);
const startsAfter = 8;
/** Small enough to sit in the side padding, so the hint takes no room. */
const hintSize = 12;
/** How far the strip follows the finger when there is no week that way. */
const endResistance = 0.2;

interface WeekPagerProps {
  week: Date[];
  today: string;
  selected: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onSelect: (date: string) => void;
  /** 1 is the next week, and -1 the previous. */
  onChangeWeek: (direction: number) => void;
}

/** The week strip, which follows a sideways swipe to the week before or after. Those two wait ready on either side. */
export function WeekPager({
  week,
  today,
  selected,
  canGoBack,
  canGoForward,
  onSelect,
  onChangeWeek,
}: WeekPagerProps) {
  const { colors, motion, size } = useTheme();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const offset = useSharedValue(0);
  const shownWeek = dateText(week[0]);

  const previousWeek = useRef(shownWeek);
  const swiped = useRef(false);

  useLayoutEffect(() => {
    if (previousWeek.current === shownWeek) {
      return;
    }

    const cameFromLater = shownWeek < previousWeek.current;
    previousWeek.current = shownWeek;

    // A swipe has slid here already, so it goes back to the middle in the same commit and the strip doesn't jump.
    if (swiped.current || reduceMotion) {
      swiped.current = false;
      offset.set(0);
      return;
    }

    // Anything else, like Back to today, slides in from the side the new week lies on.
    offset.set(cameFromLater ? -width : width);
    offset.set(withTiming(0, { duration: motion.sheetMs, easing }));
  }, [motion.sheetMs, offset, reduceMotion, shownWeek, width]);

  // A gesture keeps the handlers it started with, so they read the latest values from here.
  const latest = useRef({
    canGoBack,
    canGoForward,
    onChangeWeek,
    reduceMotion,
    sheetMs: motion.sheetMs,
    width,
  });
  useLayoutEffect(() => {
    latest.current = {
      canGoBack,
      canGoForward,
      onChangeWeek,
      reduceMotion,
      sheetMs: motion.sheetMs,
      width,
    };
  });

  const changeWeek = useCallback((direction: number) => {
    swiped.current = true;
    latest.current.onChangeWeek(direction);
  }, []);

  const settle = useCallback(
    (toValue: number, direction: number) => {
      if (latest.current.reduceMotion) {
        offset.set(toValue);
        if (direction !== 0) {
          changeWeek(direction);
        }
        return;
      }

      offset.set(
        withTiming(
          toValue,
          { duration: latest.current.sheetMs, easing },
          (finished) => {
            if (finished === true && direction !== 0) {
              scheduleOnRN(changeWeek, direction);
            }
          },
        ),
      );
    },
    [changeWeek, offset],
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
      const direction = weekAfterSwipe({
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
    transform: [{ translateX: offset.get() - width }],
  }));

  function renderPage(pageWeek: Date[], shown: boolean, hasWeek: boolean) {
    return (
      <View
        key={dateText(pageWeek[0])}
        accessibilityElementsHidden={!shown}
        importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
        style={{ width, paddingHorizontal: size.sidePadding }}
      >
        {hasWeek && (
          <WeekPage
            week={pageWeek}
            today={today}
            selected={selected}
            onSelect={onSelect}
            onChangeWeek={onChangeWeek}
          />
        )}
      </View>
    );
  }

  return (
    <SwipeArea onMove={moveSwipe} onEnd={endSwipe}>
      <Animated.View style={[styles.pages, { width: width * 3 }, slideStyle]}>
        {renderPage(weekOf(addDays(week[0], -7)), false, canGoBack)}
        {renderPage(week, true, true)}
        {renderPage(weekOf(addDays(week[0], 7)), false, canGoForward)}
      </Animated.View>
      {canGoBack && (
        <View
          testID="week-back-hint"
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
          testID="week-forward-hint"
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
  onMove,
  onEnd,
  children,
}: {
  onMove: (distance: number) => void;
  onEnd: (distance: number, velocity: number) => void;
  children: ReactNode;
}) {
  const { size } = useTheme();
  const swipe = useMemo(
    () =>
      PanResponder.create({
        // A tap goes to the day under it, which sits deeper. Only a sideways move takes over.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: (_event, { dx, dy }) =>
          Math.abs(dx) > startsAfter && Math.abs(dx) > Math.abs(dy),
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
      testID="week-strip"
      {...swipe.panHandlers}
      style={[styles.pager, { marginHorizontal: -size.sidePadding }]}
    >
      {children}
    </View>
  );
}

function WeekPage({
  week,
  today,
  selected,
  onSelect,
  onChangeWeek,
}: {
  week: Date[];
  today: string;
  selected: string;
  onSelect: (date: string) => void;
  onChangeWeek: (direction: number) => void;
}) {
  const days = useDays(dateText(week[0]), dateText(week[6]));

  return (
    <WeekStrip
      week={week}
      today={today}
      selected={selected}
      days={days.data}
      onSelect={onSelect}
      onChangeWeek={onChangeWeek}
    />
  );
}

const styles = StyleSheet.create({
  pager: {
    overflow: 'hidden',
  },
  pages: {
    flexDirection: 'row',
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
