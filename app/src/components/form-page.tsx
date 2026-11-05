import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { BackLink } from './back-link';
import { BottomActionBox } from './bottom-action-box';
import { dismissFailure } from './notifications';
import { ScreenHeading } from './screen-heading';

interface FormPageProps {
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle?: string;
  /** The main action, pinned to the bottom. The back link cancels. */
  action?: ReactNode;
  /** It opens inside a tab, so its action sits on the tab bar. */
  aboveTabBar?: boolean;
  /** Turn off while something in the form is being dragged. */
  scrollEnabled?: boolean;
  children: ReactNode;
}

/** A page to create or edit something. */
export function FormPage({
  back,
  title,
  subtitle,
  action,
  aboveTabBar = false,
  scrollEnabled = true,
  children,
}: FormPageProps) {
  const { colors, size, space } = useTheme();
  const router = useRouter();

  // A failure says nothing once the form it belongs to has closed.
  useEffect(() => dismissFailure, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Only the form makes room for the keyboard. The action stays behind it until it closes. */}
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: space.xl,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <View style={{ gap: 2 }}>
            <BackLink
              label={back}
              onPress={() => {
                router.back();
              }}
            />
            <ScreenHeading title={title} subtitle={subtitle} />
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {action !== undefined && (
        <BottomActionBox aboveTabBar={aboveTabBar}>{action}</BottomActionBox>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
