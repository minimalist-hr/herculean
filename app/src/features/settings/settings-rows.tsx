import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertIcon, ChevronRightIcon } from '@/components/icons';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { SwitchKnob } from '@/components/switch-field';
import { Tappable } from '@/components/tappable';
import { UnreadDot } from '@/features/feedback/unread-dot';
import { noValue } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

/** A titled card of settings rows, with an optional note below it. */
export function SettingsSection({
  title,
  note,
  children,
}: {
  title?: string;
  note?: string;
  children: ReactNode;
}) {
  const { colors, radius, space, text } = useTheme();

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
      {note !== undefined && <Text style={text.meta}>{note}</Text>}
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  /** What it is set to. Undefined while it loads. */
  value?: string;
  /** Shows an alert icon by the label. This says why, to screen readers. */
  attention?: string;
  /** Shows the unread dot by the label. This says why, to screen readers. */
  unread?: string;
  first?: boolean;
  /** Not available yet: it looks muted but still says why when tapped. */
  muted?: boolean;
  danger?: boolean;
  /** Opens its page or sheet, with a chevron. Without it, the row only shows its value. */
  onPress?: () => void;
  /** Whether the row has a value at all, so a skeleton shows while it loads. */
  hasValue?: boolean;
}

export function SettingsRow({
  label,
  value,
  attention,
  unread,
  first = false,
  muted = false,
  danger = false,
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
      accessibilityLabel={[label, value, attention, unread]
        .filter((part) => part !== undefined)
        .join(', ')}
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
      <View style={[styles.label, { gap: space.sm }]}>
        <Text
          style={[
            text.listItemName,
            { color: danger ? colors.danger : colors.text },
          ]}
        >
          {label}
        </Text>
        {attention !== undefined && <AlertIcon color={colors.warn} size={16} />}
        {unread !== undefined && <UnreadDot />}
      </View>
      {renderValue()}
      {onPress !== undefined && (
        <ChevronRightIcon color={colors.muted} size={16} />
      )}
    </Tappable>
  );
}

/** A setting that is on or off. The whole row switches it, and it saves at once. */
export function SettingsSwitchRow({
  label,
  value,
  failed = false,
  onChange,
}: {
  label: string;
  /** Undefined while it loads. */
  value?: boolean;
  failed?: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors, size, space, text } = useTheme();

  function renderSwitch() {
    if (value !== undefined) {
      return <SwitchKnob value={value} />;
    }

    return failed ? (
      <Text style={[text.body, { color: colors.muted }]}>{noValue}</Text>
    ) : (
      <Skeleton width={44} height={24} />
    );
  }

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value === true }}
      disabled={value === undefined}
      onPress={() => {
        if (value !== undefined) {
          onChange(!value);
        }
      }}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.listRowMin,
          paddingHorizontal: space.lg,
          borderTopWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.label, { gap: space.sm }]}>
        <Text style={[text.listItemName, { color: colors.text }]}>{label}</Text>
      </View>
      {renderSwitch()}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
