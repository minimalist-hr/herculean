import { privacyPolicy } from '@/features/account/legal-documents';
import { useLocalSearchParams } from 'expo-router';

import { LegalScreen } from '@/features/account/legal-screen';

export default function PrivacyRoute() {
  const { back = 'Create account' } = useLocalSearchParams<{ back?: string }>();

  return <LegalScreen document={privacyPolicy} back={back} />;
}
