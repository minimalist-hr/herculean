import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { usePullToRefresh } from '@/components/pull-to-refresh';
import { ScreenHeading } from '@/components/screen-heading';
import { SignOutSheet } from '@/features/settings/account-sheets';
import {
  SettingsRow,
  SettingsSection,
} from '@/features/settings/settings-rows';
import { noValue } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { summaryOf, useSystemHealth } from './use-system-health';

/** The admin's settings: System health and Sign out. */
export function AdminSettingsScreen() {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const health = useSystemHealth();
  const refreshControl = usePullToRefresh(() => health.refetch());
  const [signingOut, setSigningOut] = useState(false);
  const summary =
    health.data === undefined ? undefined : summaryOf(health.data.services);

  function healthValue() {
    if (summary !== undefined) {
      return summary.short;
    }

    return health.isLoadingError ? noValue : undefined;
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
