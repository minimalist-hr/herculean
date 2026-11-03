import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

const chipWidths = [40, 66, 56, 88, 62, 70, 52];
const sections = [
  { label: 70, rows: [190, 230, 170] },
  { label: 56, rows: [150, 210, 180] },
];

/** The group chips while they load. */
export function ChipsSkeleton() {
  const { size } = useTheme();

  return (
    <>
      {chipWidths.map((width, index) => (
        <Skeleton key={index} width={width} height={size.chip} />
      ))}
    </>
  );
}

/** The grouped list while it loads. */
export function ExercisesSkeleton() {
  const { colors, radius, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading your exercises"
      accessibilityLiveRegion="polite"
      style={{ gap: space.lg }}
    >
      {sections.map((section) => (
        <View key={section.label} style={{ gap: space.xs }}>
          <Skeleton width={section.label} height={10} />
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
            {section.rows.map((width, index) => (
              <View
                key={width}
                style={[
                  styles.row,
                  {
                    gap: space.sm,
                    minHeight: size.listRowMin,
                    paddingHorizontal: space.lg,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Skeleton width={width} height={14} />
                <Skeleton width={110} height={10} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** The details of an exercise or a group while they load. */
export function DetailsSkeleton({ label }: { label: string }) {
  const { colors, radius, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{ gap: size.gap.sectionMax, marginTop: 2 }}
    >
      <View style={styles.heading}>
        <View style={[styles.titleRow, { height: size.headerIconButton }]}>
          <Skeleton width={260} height={32} />
        </View>
        <Skeleton width={110} height={14} />
      </View>
      <View
        style={[
          styles.noSessions,
          {
            gap: space.sm,
            paddingTop: 28,
            paddingBottom: size.gap.sectionMax,
            borderRadius: radius.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Skeleton width={28} height={28} />
        <Skeleton width={130} height={16} />
        <Skeleton width={260} height={12} />
      </View>
      <View style={{ gap: space.sm }}>
        <Skeleton width={60} height={10} />
        <View
          style={[
            styles.card,
            {
              gap: space.sm,
              padding: space.lg,
              borderRadius: radius.card,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Skeleton width={280} height={14} />
          <Skeleton width={140} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: 4,
  },
  titleRow: {
    justifyContent: 'center',
  },
  noSessions: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    justifyContent: 'center',
  },
});
