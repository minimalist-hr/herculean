import { termsOfService } from '@/features/account/legal-documents';
import { useLocalSearchParams } from 'expo-router';

import { LegalScreen } from '@/features/account/legal-screen';

export default function TermsRoute() {
  const { back = 'Create account' } = useLocalSearchParams<{ back?: string }>();

  return <LegalScreen document={termsOfService} back={back} />;
}
