import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink } from '@/components/back-link';
import { useTheme } from '@/theme/theme-provider';

import type { LegalDocument } from './legal-documents';

/** A legal document as full-page text. Only create account opens these pages so far. */
export function LegalScreen({ document }: { document: LegalDocument }) {
  const { colors, size, space, text } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        gap: space.xl,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: insets.bottom + space.xl,
      }}
    >
      <View style={{ gap: space.xs }}>
        <BackLink
          label="Create account"
          onPress={() => {
            router.back();
          }}
        />
        <Text
          accessibilityRole="header"
          style={[text.pageTitle, { color: colors.text }]}
        >
          {document.title}
        </Text>
        <Text style={text.eyebrow}>{document.lastUpdated}</Text>
      </View>

      <Text style={[text.body, { color: colors.text }]}>{document.intro}</Text>

      {document.sections.map((section) => (
        <View key={section.title} style={{ gap: space.xs }}>
          <Text
            accessibilityRole="header"
            style={[text.listItemName, { color: colors.text }]}
          >
            {section.title}
          </Text>
          <Text style={[text.body, { color: colors.muted }]}>
            {section.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
