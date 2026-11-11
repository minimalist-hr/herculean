import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink } from '@/components/back-link';
import { Glow } from '@/components/glow';
import { AlertIcon, CheckIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { StatusLabel } from '@/components/status-label';
import { useMinuteClock } from '@/features/feedback/thread';
import { formatRelativeTime } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  serviceStatusLabels,
  summaryOf,
  useSystemHealth,
  type ServiceHealth,
  type ServiceStatus,
} from './use-system-health';

type Colors = ReturnType<typeof useTheme>['colors'];

function statusColor(status: ServiceStatus, colors: Colors) {
  return {
    working: colors.success,
    slow: colors.warn,
    behind: colors.warn,
    down: colors.danger,
  }[status];
}

/** How each service the API needs is doing. */
export function SystemHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, size, space } = useTheme();
  const health = useSystemHealth();
  const now = useMinuteClock();
  const [refreshing, setRefreshing] = useState(false);

  async function pullToRefresh() {
    setRefreshing(true);
    await health.refetch();
    setRefreshing(false);
  }

  function renderHealth() {
    if (health.data !== undefined) {
      const summary = summaryOf(health.data.services);
      const summaryColor = {
        working: colors.success,
        attention: colors.warn,
        down: colors.danger,
      }[summary.level];

      return (
        <>
          <HealthHero
            title={summary.long}
            color={summaryColor}
            working={summary.level === 'working'}
            detail={`${String(health.data.services.filter((service) => service.status === 'working').length)} of ${String(health.data.services.length)} services working · Checked ${formatRelativeTime(health.data.checkedAtUtc, now).toLowerCase()}`}
          />
          <ServiceList>
            {health.data.services.map((service, index) => (
              <ServiceRow
                key={service.name}
                service={service}
                first={index === 0}
              />
            ))}
          </ServiceList>
        </>
      );
    }

    if (health.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t check the system."
          onRetry={() => {
            void health.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Checking the system"
        accessibilityLiveRegion="polite"
        style={{ gap: space.xl }}
      >
        <Skeleton width="100%" height={heroHeight} />
        <ServiceList>
          {[0, 1, 2, 3, 4].map((index) => (
            <View
              key={index}
              style={[
                styles.row,
                {
                  gap: space.xs,
                  padding: space.lg,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Skeleton width={110} height={16} />
              <Skeleton width={160} height={12} />
            </View>
          ))}
        </ServiceList>
      </View>
    );
  }

  return (
    <ScrollView
      testID="health-scroll"
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        gap: space.xl,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: insets.bottom + space.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void pullToRefresh();
          }}
          tintColor={colors.primaryText}
          colors={[colors.primary]}
          progressBackgroundColor={colors.raised}
        />
      }
    >
      <View style={{ gap: space.xxxs }}>
        <BackLink
          label="Settings"
          onPress={() => {
            router.back();
          }}
        />
        <ScreenHeading title="System health" />
      </View>
      {renderHealth()}
    </ScrollView>
  );
}

function ServiceList({ children }: { children: React.ReactNode }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

function ServiceRow({
  service,
  first,
}: {
  service: ServiceHealth;
  first: boolean;
}) {
  const { colors, space, text } = useTheme();
  const label = serviceStatusLabels[service.status];

  return (
    <View
      accessible
      accessibilityLabel={`${service.name}, ${label}, ${String(service.durationMs)} ms, ${service.detail}`}
      style={[
        styles.row,
        {
          gap: space.xs,
          padding: space.lg,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={[styles.heading, { gap: space.sm }]}>
        <Text style={[text.listItemName, styles.name, { color: colors.text }]}>
          {service.name}
        </Text>
        <Text style={text.meta}>{`${String(service.durationMs)} ms`}</Text>
      </View>
      <StatusLabel label={label} color={statusColor(service.status, colors)} />
      <Text style={text.meta}>{service.detail}</Text>
    </View>
  );
}

/** The hero's height, so its skeleton takes the same room. */
const heroHeight = 220;

const heroMark = 72;

/** The page's focus: how the whole system is doing, big, in its status color. */
function HealthHero({
  title,
  detail,
  color,
  working,
}: {
  title: string;
  detail: string;
  color: string;
  working: boolean;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${detail}`}
      style={[
        styles.hero,
        {
          height: heroHeight,
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Glow radiusX={0.7} radiusY={0.6} fadeAt={0.9} color={color} />
      <View
        style={[
          styles.mark,
          {
            width: heroMark,
            height: heroMark,
            borderRadius: radius.control,
            borderColor: color,
            backgroundColor: colors.bg,
          },
        ]}
      >
        {working ? (
          <CheckIcon color={color} size={36} />
        ) : (
          <AlertIcon color={color} size={36} />
        )}
      </View>
      <Text style={[text.cardTitle, styles.centered, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[text.meta, styles.centered]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {},
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
});
