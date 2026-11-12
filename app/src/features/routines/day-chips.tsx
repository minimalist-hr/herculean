import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { dayNames, weekdays, type Weekday } from '@/formats/formats';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';

interface DayChipsProps {
  selected: Weekday[];
  /** Picks or clears a day. */
  onChange: (selected: Weekday[]) => void;
}

/** The seven days of the week, with a routine's days picked. */
export function DayChips({ selected, onChange }: DayChipsProps) {
  const { colors, line, radius, size, text } = useTheme();

  return (
    <View style={styles.row}>
      {weekdays.map((weekday) => {
        const picked = selected.includes(weekday);
        const chipStyle = {
          height: size.chip,
          borderWidth: line,
          borderRadius: radius.pill,
          borderColor: picked ? colors.primary : colors.border,
          backgroundColor: picked ? colors.primary : colors.raised,
        };

        return (
          <Tappable
            key={weekday}
            accessibilityRole="button"
            accessibilityLabel={dayNames[weekday].full}
            accessibilityState={{ selected: picked }}
            onPress={() => {
              onChange(
                weekdays.filter((day) =>
                  day === weekday ? !picked : selected.includes(day),
                ),
              );
            }}
            style={[styles.chip, chipStyle]}
          >
            <Text
              style={[
                text.chip,
                { color: picked ? colors.onPrimary : colors.text },
              ]}
            >
              {dayNames[weekday].short}
            </Text>
          </Tappable>
        );
      })}
    </View>
  );
}

/** The seven days while a routine's days load. */
export function DayChipsSkeleton() {
  const { size } = useTheme();

  return (
    <View style={styles.row}>
      {weekdays.map((weekday) => (
        <View key={weekday} style={styles.skeleton}>
          <Skeleton width="100%" height={size.chip} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: tokens.space.xxs,
  },
  skeleton: {
    flex: 1,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
