import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Stands in for a tab's screen until its feature builds it. */
export function PlaceholderScreen({ title }: { title: string }) {
  const { colors, size, text } = useTheme();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: size.sidePadding,
          paddingTop: size.topPaddingTab,
        },
      ]}
    >
      <Text style={[text.pageTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
