import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { BackLink } from './back-link';

interface PlaceholderScreenProps {
  title: string;
  /** For a sub-page: the screen its back link returns to, for example "Create account". */
  back?: string;
  /** Sits at the right of the title, for example the avatar on Home. */
  action?: ReactNode;
}

/** Stands in for a screen until its feature builds it. */
export function PlaceholderScreen({
  title,
  back,
  action,
}: PlaceholderScreenProps) {
  const { colors, size, text } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size.sidePadding,
          paddingTop:
            back === undefined ? size.topPaddingTab : size.topPaddingSubPage,
        },
      ]}
    >
      {back !== undefined && (
        <BackLink
          label={back}
          onPress={() => {
            router.back();
          }}
        />
      )}
      <View style={styles.titleRow}>
        <Text style={[text.pageTitle, { color: colors.text }]}>{title}</Text>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
