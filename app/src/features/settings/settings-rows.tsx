import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { useTheme } from '@/theme/theme-provider';

/** A titled card of settings rows. */
export function SettingsSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const { colors, radius, space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {title !== undefined && <SectionTitle>{title}</SectionTitle>}
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
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  /** What it is set to. Undefined while it loads. */
  value?: string;
  first?: boolean;
  /** Not available yet: it looks muted but still says why when tapped. */
  muted?: boolean;
  danger?: boolean;
  /** Does something rather than open a page, so it has no chevron. */
  action?: boolean;
  /** Opens its page. Without it, the row only shows its value. */
  onPress?: () => void;
  /** Whether the row has a value at all, so a skeleton shows while it loads. */
  hasValue?: boolean;
}

export function SettingsRow({
  label,
  value,
  first = false,
  muted = false,
  danger = false,
  action = false,
  onPress,
  hasValue = true,
}: SettingsRowProps) {
  const { colors, opacity, size, space, text } = useTheme();

  function renderValue() {
    if (!hasValue) {
      return null;
    }
    if (value === undefined) {
      return <Skeleton width={80} height={14} />;
    }

    return (
      <Text
        numberOfLines={1}
        style={[text.body, styles.value, { color: colors.muted }]}
      >
        {value}
      </Text>
    );
  }

  return (
    <Tappable
      feedback="fill"
      accessibilityRole={onPress === undefined ? undefined : 'button'}
      accessibilityLabel={value === undefined ? label : `${label}, ${value}`}
      disabled={onPress === undefined}
      onPress={onPress}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.listRowMin,
          paddingHorizontal: space.lg,
          borderTopWidth: first ? 0 : 1,
          borderColor: colors.border,
          opacity: muted ? opacity.dimmed : 1,
        },
      ]}
    >
      <Text
        style={[
          text.listItemName,
          styles.label,
          { color: danger ? colors.danger : colors.text },
        ]}
      >
        {label}
      </Text>
      {renderValue()}
      {onPress !== undefined && !action && (
        <ChevronRightIcon color={colors.muted} size={16} />
      )}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
