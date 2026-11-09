import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { CloseIcon, SearchIcon } from './icons';
import { notifyFailure } from './notifications';
import { Tappable } from './tappable';

const iconSize = 18;

interface SearchFieldProps {
  /** Says what is searched, for example "Search exercises". */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** There is nothing to search yet: it stays in place, muted, and a press says this. */
  mutedReason?: string;
}

/** The search input of a list. Once it has text, a button clears it. */
export function SearchField({
  label,
  value,
  onChangeText,
  mutedReason,
}: SearchFieldProps) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const muted = mutedReason !== undefined;
  const hasText = value !== '' && !muted;

  const field = (
    <View>
      <TextInput
        accessibilityLabel={label}
        editable={!muted}
        placeholder={label}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          text.input,
          {
            height: size.input,
            paddingLeft: space.md + iconSize + space.sm,
            paddingRight: hasText ? size.touchTargetMin : space.md,
            borderRadius: radius.control,
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.searchIcon, { left: space.md }]}
      >
        <SearchIcon color={colors.muted} size={iconSize} />
      </View>
      {hasText && (
        <Tappable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChangeText('');
          }}
          style={[styles.clear, { width: size.touchTargetMin }]}
        >
          <CloseIcon color={colors.muted} size={iconSize} />
        </Tappable>
      )}
    </View>
  );

  if (mutedReason === undefined) {
    return field;
  }

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        notifyFailure(mutedReason);
      }}
      style={{ opacity: opacity.dimmed }}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {field}
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    // Android adds its own padding and top-aligns the text, so the text sits off center.
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  searchIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clear: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
