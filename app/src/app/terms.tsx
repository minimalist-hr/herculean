import { termsOfService } from '@/features/account/legal-documents';
import { LegalScreen } from '@/features/account/legal-screen';

export default function TermsRoute() {
  return <LegalScreen document={termsOfService} />;
}
