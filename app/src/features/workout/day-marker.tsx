import { StyleSheet, View } from 'react-native';

import type { components } from '@/api/schema';
import { useTheme } from '@/theme/theme-provider';

type DayStatus = components['schemas']['DayStatus'];

/** The short bar under a day. */
export function MarkerBar({
  color,
  testID,
}: {
  color: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[styles.bar, { backgroundColor: color }]} />
  );
}

/** A day's marker in the week strip or the month. A selected day's is white, and a rest day has none. */
export function DayMarker({
  date,
  status,
  selected,
}: {
  date: string;
  status: DayStatus;
  selected: boolean;
}) {
  const { colors } = useTheme();
  const color = {
    completed: colors.success,
    inProgress: colors.primaryText,
    missed: colors.danger,
    planned: colors.muted,
    skipped: colors.skipped,
  };

  return (
    <MarkerBar
      testID={`marker-${date}`}
      color={
        status === 'rest'
          ? 'transparent'
          : selected
            ? colors.onPrimary
            : color[status]
      }
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    width: 10,
    height: 2,
  },
});
