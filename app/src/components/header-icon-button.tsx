import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Tappable } from './tappable';

interface HeaderIconButtonProps {
  label: string;
  onPress: () => void;
  children: ReactNode;
}

/** An outlined icon button in a screen's header, for example Groups on the exercise list. */
export function HeaderIconButton({
  label,
  onPress,
  children,
}: HeaderIconButtonProps) {
  const { colors, radius, size } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size.headerIconButton,
          height: size.headerIconButton,
          borderRadius: radius.control,
          borderColor: colors.border,
          backgroundColor: colors.raised,
        },
      ]}
    >
      {children}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
