import { Pressable, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A filter chip. The selected one uses the accent. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        height: size.chip,
        justifyContent: 'center',
        paddingHorizontal: space.md,
        borderWidth: 1,
        borderRadius: radius.pill,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : 'transparent',
      }}
    >
      <Text
        style={[
          text.chip,
          { color: selected ? colors.onPrimary : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
