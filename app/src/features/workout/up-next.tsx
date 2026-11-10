import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { SectionTitle } from '@/components/section-title';
import { daysFrom } from '@/formats/dates';
import { formatShortDate } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

type Day = components['schemas']['DayResponse'];

function upNextWhen(date: string, today: string) {
  const days = daysFrom(today, date);
  if (days === 0) {
    return 'Today';
  }

  return days === 1 ? 'Tomorrow' : formatShortDate(date);
}

export function UpNext({
  upNext,
  today,
}: {
  upNext: Day['upNext'];
  today: string;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View
      style={[
        styles.upNext,
        {
          gap: space.md,
          paddingTop: space.md,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={{ gap: space.xxxs }}>
        <SectionTitle>Up next</SectionTitle>
        <Text style={[text.listItemName, { color: colors.text }]}>
          {upNext.routineName ?? 'Rest'}
        </Text>
      </View>
      <Text style={text.meta}>{upNextWhen(upNext.date, today)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
});
