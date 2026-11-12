import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  /** Turn off while something in the form is being dragged. */
  scrollEnabled?: boolean;
  /** A header icon button beside the title, such as a delete. */
  headerAction?: ReactNode;
  children: ReactNode;
}

/** A page to create or edit something. */
export function FormPage({
  back,
  title,
  subtitle,
  action,
  scrollEnabled = true,
  headerAction,
  children,
}: FormPageProps) {
  const { colors, size, space } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
            // Without an action box, the page ends clear of the home indicator.
            paddingBottom:
              action === undefined ? insets.bottom + space.lg : space.lg,
          }}
        >
          <View style={{ gap: space.xxxs }}>
            <BackLink
              label={back}
              onPress={() => {
                router.back();
              }}
            />
            <ScreenHeading
              title={title}
              subtitle={subtitle}
              action={headerAction}
            />
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {action !== undefined && <BottomActionBox>{action}</BottomActionBox>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
