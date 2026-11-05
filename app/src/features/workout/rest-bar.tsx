import { useEffect, useState } from 'react';
import {
  PixelRatio,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { ChevronDownIcon, ClockIcon } from '@/components/icons';
import { Tappable } from '@/components/tappable';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  adjust,
  finish,
  hide,
  restClock,
  show,
  start,
  stepSeconds,
  type Rest,
} from './rest-timer';

/** The room the page keeps at its end, so the bar or the small button never covers anything. */
export const restBarRoom = { open: 80, hidden: 60 };

const barGap = 4;
const hideWidth = 28;
const stepWidth = 44;
const actionWidth = 76;
/** The side padding, the bar's borders and padding, its controls and the gaps between them. */
const barTaken =
  16 * 2 + 2 + 8 + hideWidth + stepWidth * 2 + actionWidth + barGap * 4;
const fullTextSize = 22;
/** How wide "REST 10:00", the longest it gets with the steppers showing, is at the full size. */
const longestTextWidth = 126;

/** The size of the label and the time. It's worked out from the screen alone, so it never changes with the time. */
export function restTextSize(windowWidth: number, fontScale: number) {
  const room = windowWidth - barTaken;
  const fits = (fullTextSize * room) / (longestTextWidth * fontScale);

  return Math.min(fullTextSize, Math.floor(fits));
}

function currentTime() {
  return Date.now();
}

/** The time now, renewed every second while it matters. */
function useNow(ticking: boolean) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!ticking) {
      return undefined;
    }

    const timer = setInterval(() => {
      tick((count) => count + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [ticking]);

  return currentTime();
}

function StepButton({
  label,
  spoken,
  onPress,
}: {
  label: string;
  spoken: string;
  onPress: () => void;
}) {
  const { colors, radius, size, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      onPress={onPress}
      style={[
        styles.step,
        {
          height: size.touchTargetMin,
          borderRadius: radius.control,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[text.secondaryButton, { color: colors.text }]}>
        {label}
      </Text>
    </Tappable>
  );
}

/** The rest timer above the tab bar: the whole bar, or a small button that opens it. */
export function RestBar({
  rest,
  onChange,
}: {
  rest: Rest;
  onChange: (rest: Rest) => void;
}) {
  const { colors, radius, size, space, text } = useTheme();
  const window = useWindowDimensions();
  const fontSize = restTextSize(window.width, PixelRatio.getFontScale());
  const now = useNow(rest.endsAt !== null);
  const clock = restClock(rest, now);
  const over = clock.phase === 'over';
  const time = `${over ? '+' : ''}${formatClock(clock.seconds)}`;
  const timeColor = over ? colors.success : colors.text;
  const box = {
    bottom: space.sm,
    borderRadius: radius.card,
    borderColor: colors.border,
    backgroundColor: colors.raised,
  };

  if (!rest.open) {
    return (
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={`Show rest timer, ${time}`}
        onPress={() => {
          onChange(show(rest));
        }}
        style={[
          styles.small,
          box,
          {
            right: size.sidePadding,
            gap: space.sm,
            height: size.touchTargetMin,
            paddingHorizontal: space.md,
          },
        ]}
      >
        <ClockIcon color={colors.muted} size={18} />
        <Text style={[text.listItemName, { color: timeColor }]}>{time}</Text>
      </Tappable>
    );
  }

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel="Rest timer"
      style={[
        styles.bar,
        box,
        {
          left: size.sidePadding,
          right: size.sidePadding,
          gap: barGap,
          paddingRight: space.sm,
        },
      ]}
    >
      <Tappable
        accessibilityRole="button"
        accessibilityLabel="Hide rest timer"
        onPress={() => {
          onChange(hide(rest));
        }}
        style={[styles.hide, { height: size.touchTargetMin }]}
      >
        <ChevronDownIcon color={colors.muted} size={20} />
      </Tappable>
      {/* One line of text, so the label and the time are always the same size. */}
      <Text
        numberOfLines={1}
        style={[
          text.cardTitle,
          styles.reading,
          { color: colors.muted, fontSize },
        ]}
      >
        {'REST '}
        <Text style={{ color: timeColor }}>{time}</Text>
      </Text>
      {!over && (
        <>
          <StepButton
            label={`−${String(stepSeconds)}`}
            spoken={`Subtract ${String(stepSeconds)} seconds`}
            onPress={() => {
              onChange(adjust(rest, -stepSeconds));
            }}
          />
          <StepButton
            label={`+${String(stepSeconds)}`}
            spoken={`Add ${String(stepSeconds)} seconds`}
            onPress={() => {
              onChange(adjust(rest, stepSeconds));
            }}
          />
        </>
      )}
      {/* A fixed width, so the time and the steppers don't move when the label changes. */}
      <View style={styles.action}>
        {clock.phase === 'ready' ? (
          <Button
            label="Start"
            onPress={() => {
              onChange(start(rest, currentTime()));
            }}
          />
        ) : (
          <Button
            label={over ? 'Done' : 'Skip'}
            onPress={() => {
              onChange(finish(rest));
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  small: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  bar: {
    position: 'absolute',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  hide: {
    width: hideWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reading: {
    flex: 1,
    minWidth: 0,
  },
  action: {
    width: actionWidth,
  },
  step: {
    width: stepWidth,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
