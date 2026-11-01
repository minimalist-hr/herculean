import { privacyPolicy } from '@/features/account/legal-documents';
import { LegalScreen } from '@/features/account/legal-screen';

export default function PrivacyRoute() {
  return <LegalScreen document={privacyPolicy} />;
}
