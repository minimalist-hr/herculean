import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { StatTile } from '@/components/stat-tile';
import { tokens } from '@/theme/tokens';
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
  const { cardLine, colors, radius, size, space } = useTheme();

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
                borderWidth: cardLine,
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

/** The details of an exercise or a group while they load. With tiles, an exercise's progress tiles take the card's place. */
export function DetailsSkeleton({
  label,
  tiles = false,
}: {
  label: string;
  tiles?: boolean;
}) {
  const { cardLine, colors, line, radius, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}
    >
      <View style={styles.heading}>
        <View style={[styles.titleRow, { height: size.headerIconButton }]}>
          <Skeleton width={260} height={32} />
        </View>
        <Skeleton width={110} height={14} />
      </View>
      {tiles ? (
        <>
          <View style={[styles.tiles, { gap: space.sm }]}>
            <StatTile total label="Best set" />
            <StatTile total label="Done" skeletonWidth={70} />
          </View>
          <View style={{ gap: space.sm }}>
            <Skeleton width={90} height={10} />
            <View
              style={[
                styles.card,
                {
                  borderWidth: cardLine,
                  padding: space.lg,
                  borderRadius: radius.card,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Skeleton width="100%" height={150} />
            </View>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.noSessions,
            {
              borderWidth: line,
              gap: space.sm,
              paddingTop: space.xl,
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
      )}
      <View style={{ gap: space.sm }}>
        <Skeleton width={60} height={10} />
        <View
          style={[
            styles.card,
            {
              borderWidth: cardLine,
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
    gap: tokens.space.xxs,
  },
  titleRow: {
    justifyContent: 'center',
  },
  noSessions: {
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  card: {
    overflow: 'hidden',
  },
  tiles: {
    flexDirection: 'row',
  },
  row: {
    justifyContent: 'center',
  },
});
