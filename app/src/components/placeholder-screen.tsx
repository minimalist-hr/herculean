import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { BackLink } from './back-link';

interface PlaceholderScreenProps {
  title: string;
  /** For a sub-page: the screen its back link returns to, for example "Create account". */
  back?: string;
}

/** Stands in for a screen until its feature builds it. */
export function PlaceholderScreen({ title, back }: PlaceholderScreenProps) {
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
      <Text style={[text.pageTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
