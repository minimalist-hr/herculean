import { screen } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { ThemeProvider } from '@/theme/theme-provider';

import { privacyPolicy, termsOfService } from './legal-documents';
import { LegalScreen } from './legal-screen';

function Layout() {
  return (
    <ThemeProvider theme="dark">
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

test.each([termsOfService, privacyPolicy])(
  '$title shows everything in the document',
  async (legalDocument) => {
    await renderRouter(
      {
        _layout: Layout,
        index: () => (
          <LegalScreen document={legalDocument} back="Create account" />
        ),
      },
      { initialUrl: '/' },
    );

    expect(
      screen.getByRole('header', { name: legalDocument.title }),
    ).toBeOnTheScreen();
    expect(screen.getByText(legalDocument.lastUpdated)).toBeOnTheScreen();
    expect(screen.getByText(legalDocument.intro)).toBeOnTheScreen();
    for (const section of legalDocument.sections) {
      expect(
        screen.getByRole('header', { name: section.title }),
      ).toBeOnTheScreen();
      expect(screen.getByText(section.body)).toBeOnTheScreen();
    }
  },
);
