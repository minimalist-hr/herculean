import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { usePullToRefresh } from '@/components/pull-to-refresh';
import { ScreenHeading } from '@/components/screen-heading';
import type { components } from '@/api/schema';
import { useCurrentUser } from '@/features/account/use-current-user';
import { SignOutSheet } from '@/features/settings/account-sheets';
import { themeLabels } from '@/features/settings/settings-labels';
import {
  SettingsRow,
  SettingsSection,
} from '@/features/settings/settings-rows';
import { noValue } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  announcementStatus,
  useAdminAnnouncement,
} from '@/features/announcement/use-announcement';

import { useSavedReplies } from './use-saved-replies';
import { useStarterExercises } from './use-starter-content';
import { summaryOf, useSystemHealth } from './use-system-health';

/** The admin's settings: System health and Sign out. */
export function AdminSettingsScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const health = useSystemHealth();
  const user = useCurrentUser();
  const savedReplies = useSavedReplies();
  const announcement = useAdminAnnouncement();
  const starterExercises = useStarterExercises();
  const refreshControl = usePullToRefresh(() =>
    Promise.all([
      health.refetch(),
      savedReplies.refetch(),
      announcement.refetch(),
      starterExercises.refetch(),
    ]),
  );
  const [signingOut, setSigningOut] = useState(false);
  const summary =
    health.data === undefined ? undefined : summaryOf(health.data.services);

  function healthValue() {
    if (summary !== undefined) {
      return summary.short;
    }

    return health.isLoadingError ? noValue : undefined;
  }

  function userValue(
    show: (data: components['schemas']['UserResponse']) => string,
  ) {
    if (user.data !== undefined) {
      return show(user.data);
    }

    return user.isLoadingError ? noValue : undefined;
  }

  function announcementValue() {
    if (announcement.data !== undefined) {
      return announcementStatus(announcement.data, new Date());
    }

    return announcement.isLoadingError ? noValue : undefined;
  }

  function starterExercisesValue() {
    if (starterExercises.data !== undefined) {
      return String(starterExercises.data.length);
    }

    return starterExercises.isLoadingError ? noValue : undefined;
  }

  function savedRepliesValue() {
    if (savedReplies.data !== undefined) {
      return String(savedReplies.data.length);
    }

    return savedReplies.isLoadingError ? noValue : undefined;
  }

  return (
    <>
      <ScrollView
        testID="admin-settings-scroll"
        refreshControl={refreshControl}
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={{
          gap: space.xl,
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: pageEnd,
        }}
      >
        <ScreenHeading title="Settings" subtitle="Keep an eye on Herculean." />
        <SettingsSection title="Appearance">
          <SettingsRow
            first
            label="Themes"
            value={userValue((data) => themeLabels[data.theme])}
            onPress={() => {
              router.push('/admin/settings/theme');
            }}
          />
        </SettingsSection>
        <SettingsSection title="System">
          <SettingsRow
            first
            label="System health"
            value={healthValue()}
            attention={
              summary === undefined || summary.level === 'working'
                ? undefined
                : 'open it to see why'
            }
            onPress={() => {
              router.push('/admin/settings/health');
            }}
          />
        </SettingsSection>
        <SettingsSection title="Feedback">
          <SettingsRow
            first
            label="Saved replies"
            value={savedRepliesValue()}
            onPress={() => {
              router.push('/admin/settings/saved-replies');
            }}
          />
        </SettingsSection>
        <SettingsSection title="Content">
          <SettingsRow
            first
            label="Announcement"
            value={announcementValue()}
            onPress={() => {
              router.push('/admin/settings/announcement');
            }}
          />
          <SettingsRow
            label="Starter exercises"
            value={starterExercisesValue()}
            onPress={() => {
              router.push('/admin/settings/starter');
            }}
          />
        </SettingsSection>
        <SettingsSection>
          <SettingsRow
            first
            label="Sign out"
            hasValue={false}
            onPress={() => {
              setSigningOut(true);
            }}
          />
        </SettingsSection>
      </ScrollView>
      <SignOutSheet
        visible={signingOut}
        onClose={() => {
          setSigningOut(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
