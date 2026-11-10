import { Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { notifyFailure } from './notifications';
import { Tappable } from './tappable';

/** A switch that only shows its state, because the row around it takes the tap. */
export function SwitchKnob({ value }: { value: boolean }) {
  const { colors } = useTheme();

  return (
    <View pointerEvents="none">
      <Switch
        // The web draws the knob of a switch that is on in its own color unless told otherwise.
        {...(Platform.OS === 'web' ? { activeThumbColor: colors.text } : {})}
        value={value}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.text}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

/** A form's on or off choice, with a line below its label. Unavailable, it looks muted and a press says why. */
export function SwitchField({
  label,
  hint,
  value,
  unavailable,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  /** Why it can't be switched on now. */
  unavailable?: string;
  onChange: (value: boolean) => void;
}) {
  const { opacity, size, space, text, colors } = useTheme();
  const muted = unavailable !== undefined && !value;

  return (
    <Tappable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      onPress={() => {
        if (muted) {
          notifyFailure(unavailable);
          return;
        }

        onChange(!value);
      }}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.touchTargetMin,
          opacity: muted ? opacity.dimmed : 1,
        },
      ]}
    >
      <View style={[styles.label, { gap: space.xxxs }]}>
        <Text style={[text.listItemName, { color: colors.text }]}>{label}</Text>
        {hint !== undefined && <Text style={text.meta}>{hint}</Text>}
      </View>
      <SwitchKnob value={value} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
});
