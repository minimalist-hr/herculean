import { StyleSheet, Text, View } from 'react-native';

import { NameLink } from '@/components/name-link';
import { useLinks } from '@/features/links/use-links';

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
  const { colors, line, space, text } = useTheme();
  const links = useLinks('day');
  // Read as maybe missing, since an API from before it was added leaves it out.
  const routineId = upNext.routineId as string | null | undefined;

  return (
    <View
      style={[
        styles.upNext,
        {
          borderTopWidth: line,
          gap: space.md,
          paddingTop: space.md,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={{ gap: space.xxxs }}>
        <SectionTitle>Up next</SectionTitle>
        {typeof routineId === 'string' && upNext.routineName !== null ? (
          <NameLink
            name={upNext.routineName}
            style={text.listItemName}
            onPress={() => {
              links.routine(routineId);
            }}
          />
        ) : (
          <Text style={[text.listItemName, { color: colors.text }]}>
            {upNext.routineName ?? 'Rest'}
          </Text>
        )}
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
  },
});
