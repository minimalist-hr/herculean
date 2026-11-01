import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Glow } from '@/components/glow';
import { TextLink } from '@/components/text-link';
import { Wordmark } from '@/components/wordmark';
import { useTheme } from '@/theme/theme-provider';

import { restoreSession } from './session-flows';

/** The logo while the app checks the stored session. Without a connection, it offers to try again. */
export function LaunchScreen() {
  const { colors, space, text } = useTheme();
  const { mutate: restore, isError } = useMutation({
    mutationFn: restoreSession,
  });

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Glow radiusX={0.9} radiusY={0.45} fadeAt={0.95} />
      <View>
        <Wordmark />
        {/* Hangs below the logo, so the logo stays in the middle. */}
        {isError && (
          <View style={[styles.failure, { marginTop: space.xl }]}>
            <Text
              accessibilityRole="alert"
              style={[text.body, { color: colors.muted }]}
            >
              Couldn&apos;t connect.
            </Text>
            <TextLink
              label="Try again"
              onPress={() => {
                restore();
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
  },
  failure: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
