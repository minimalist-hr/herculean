import { useState, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { EyeIcon, EyeOffIcon } from './icons';
import { OptionalNote } from './optional-note';
import { Tappable } from './tappable';

interface TextFieldProps extends Omit<
  TextInputProps,
  'style' | 'secureTextEntry'
> {
  label: string;
  /** Shown under the field, for example "At least 8 characters." An error replaces it. An empty error only turns the border red, when another field carries the message. */
  helper?: string;
  error?: string;
  /** Hides what is typed, with an eye button to show it. */
  password?: boolean;
  /** Adds "· optional" after the label. */
  optional?: boolean;
  /** Lets the form focus the input, for example the next field or the first error. */
  ref?: Ref<TextInputInstance>;
}

/** An input with its uppercase label above and its helper or error below. */
export function TextField({
  label,
  helper,
  error,
  password = false,
  optional = false,
  ref,
  ...inputProps
}: TextFieldProps) {
  const { colors, line, radius, size, space, text } = useTheme();
  const [hidden, setHidden] = useState(true);
  const message = error ?? helper;
  const multiline = inputProps.multiline === true;

  return (
    <View style={{ gap: space.sm }}>
      <Text style={text.eyebrow}>
        {label}
        {optional && <OptionalNote />}
      </Text>
      <View>
        <TextInput
          {...inputProps}
          ref={ref}
          accessibilityLabel={label}
          secureTextEntry={password && hidden}
          style={[
            styles.input,
            text.input,
            multiline && styles.multiline,
            {
              borderWidth: line,
              height: multiline ? undefined : size.input,
              minHeight: multiline ? size.input * multilineRows : undefined,
              paddingVertical: multiline ? space.md : 0,
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
          <Tappable
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
          </Tappable>
        )}
      </View>
      {message !== undefined && message !== '' && (
        <Text
          style={[text.meta, error !== undefined && { color: colors.danger }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

/** A multiline field starts this many single lines tall. */
const multilineRows = 3;

const styles = StyleSheet.create({
  input: {
    // Android adds its own padding and top-aligns the text, so the text sits off center.
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  // A long text starts at the top, and the field grows with it.
  multiline: {
    textAlignVertical: 'top',
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
