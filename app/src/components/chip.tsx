import { Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { ChevronRightIcon } from './icons';
import { Tappable } from './tappable';

interface ChipProps {
  label: string;
  /** What the chip shows, when a screen reader needs more than that. It shows the label otherwise. */
  text?: string;
  selected: boolean;
  /** It isn't available yet, but a press can say why. */
  muted?: boolean;
  onPress: () => void;
}

/** A chip that opens another screen, among filter chips. */
export function ChipLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors, line, radius, size, space, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        height: size.chip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        paddingHorizontal: space.md,
        borderWidth: line,
        borderRadius: radius.pill,
        borderColor: colors.border,
        backgroundColor: colors.raised,
      }}
    >
      <Text style={[text.chip, { color: colors.text }]}>{label}</Text>
      <ChevronRightIcon color={colors.muted} size={14} />
    </Tappable>
  );
}

/** A filter chip. The selected one uses the accent. */
export function Chip({
  label,
  text: shownText = label,
  selected,
  muted = false,
  onPress,
}: ChipProps) {
  const { colors, line, opacity, radius, size, space, text } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        height: size.chip,
        justifyContent: 'center',
        paddingHorizontal: space.md,
        borderWidth: line,
        borderRadius: radius.pill,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : 'transparent',
        opacity: muted ? opacity.dimmed : 1,
      }}
    >
      <Text
        style={[
          text.chip,
          { color: selected ? colors.onPrimary : colors.text },
        ]}
      >
        {shownText}
      </Text>
    </Tappable>
  );
}
