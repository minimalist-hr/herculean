import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFloatingRoom } from '@/components/above-tab-bar';
import { useCurrentUser } from '@/features/account/use-current-user';
import { ProfileButton } from '@/features/settings/profile-button';
import { dateText } from '@/formats/dates';
import { useDayRefresh } from '@/features/workout/use-day-refresh';
import { useTheme } from '@/theme/theme-provider';

import {
  MonthSection,
  RecordsSection,
  StreakSection,
  TodaySection,
  WeekSection,
} from './home-sections';

const afternoonFrom = 12;
const eveningFrom = 18;

function greeting(hour: number, name?: string | null) {
  let timeOfDay = 'evening';
  if (hour < afternoonFrom) {
    timeOfDay = 'morning';
  } else if (hour < eveningFrom) {
    timeOfDay = 'afternoon';
  }

  const firstName = name?.trim().split(/\s+/)[0];

  return firstName ? `Good ${timeOfDay}, ${firstName}` : `Good ${timeOfDay}`;
}

/** Home: what to do today, whether you're on track, and whether you're getting stronger. */
export function HomeScreen() {
  const { colors, size, space, text } = useTheme();
  const floatingRoom = useFloatingRoom();
  const { now } = useDayRefresh();
  const user = useCurrentUser();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        gap: space.xl,
        paddingTop: size.topPaddingTab,
        paddingHorizontal: size.sidePadding,
        paddingBottom: space.xl + floatingRoom,
      }}
    >
      <View style={[styles.header, { gap: space.md }]}>
        <Text
          numberOfLines={2}
          style={[text.pageTitle, styles.title, { color: colors.text }]}
        >
          {greeting(now.getHours(), user.data?.name)}
        </Text>
        <ProfileButton />
      </View>
      <TodaySection today={dateText(now)} />
      <WeekSection now={now} />
      <MonthSection now={now} />
      <StreakSection />
      <RecordsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
  },
});
