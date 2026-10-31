import { useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { EyeIcon, EyeOffIcon } from './icons';

interface TextFieldProps extends Omit<
  TextInputProps,
  'style' | 'secureTextEntry'
> {
  label: string;
  /** Shown under the field, for example "At least 8 characters." An error replaces it. */
  helper?: string;
  error?: string;
  /** Hides what is typed, with an eye button to show it. */
  password?: boolean;
  /** Lets the form focus the input, for example the next field or the first error. */
  ref?: Ref<TextInputInstance>;
}

/** An input with its uppercase label above and its helper or error below. */
export function TextField({
  label,
  helper,
  error,
  password = false,
  ref,
  ...inputProps
}: TextFieldProps) {
  const { colors, radius, size, space, text } = useTheme();
  const [hidden, setHidden] = useState(true);
  const message = error ?? helper;

  return (
    <View style={{ gap: space.sm }}>
      <Text style={text.eyebrow}>{label}</Text>
      <View>
        <TextInput
          {...inputProps}
          ref={ref}
          accessibilityLabel={label}
          secureTextEntry={password && hidden}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            text.input,
            {
              height: size.input,
              paddingLeft: space.md,
              paddingRight: password ? size.touchTargetMin : space.md,
              borderRadius: radius.control,
              borderColor: error === undefined ? colors.border : colors.danger,
              backgroundColor: colors.raised,
              color: colors.text,
            },
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hidden
                ? `Show ${label.toLowerCase()}`
                : `Hide ${label.toLowerCase()}`
            }
            onPress={() => {
              setHidden(!hidden);
            }}
            style={[styles.eye, { width: size.touchTargetMin }]}
          >
            {hidden ? (
              <EyeIcon color={colors.muted} />
            ) : (
              <EyeOffIcon color={colors.muted} />
            )}
          </Pressable>
        )}
      </View>
      {message !== undefined && (
        <Text
          style={[text.meta, error !== undefined && { color: colors.danger }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    // Android adds its own padding and top-aligns the text, so the text sits off center.
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  eye: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
