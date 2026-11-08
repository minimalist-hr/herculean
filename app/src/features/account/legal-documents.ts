export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: readonly { title: string; body: string }[];
}

export const termsOfService: LegalDocument = {
  title: 'Terms of service',
  lastUpdated: 'Last updated 22 October 2026',
  intro:
    'These terms cover your use of Herculean, a workout log made by Minimalist.',
  sections: [
    {
      title: '1. Your account',
      body: 'You need an account to use Herculean. Keep your password private. You’re responsible for what happens in your account.',
    },
    {
      title: '2. Using the app',
      body: 'Herculean helps you plan and log workouts. It doesn’t give medical advice. Check with a doctor before starting a new training program.',
    },
    {
      title: '3. Your content',
      body: 'The routines, exercises and workouts you log are yours. We only use them to run the app for you.',
    },
    {
      title: '4. Changes',
      body: 'We may update the app and these terms. If a change matters, we’ll tell you in the app before it applies.',
    },
    {
      title: '5. Ending',
      body: 'You can delete your account at any time in Settings. We can close accounts that break these terms.',
    },
    {
      title: '6. Contact',
      body: 'Questions about these terms: hello@minimalist.hr.',
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  title: 'Privacy policy',
  lastUpdated: 'Last updated 8 November 2026',
  intro: 'This policy explains what Herculean stores about you and why.',
  sections: [
    {
      title: '1. What we store',
      body: 'Your email, name, a protected form of your password that can’t be read, your optional profile photo, your settings, the routines, exercises and groups you set up, and the workouts and sets you log.',
    },
    {
      title: '2. Why',
      body: 'Only to run the app: to sign you in, show your workouts on every device, and calculate your history and records.',
    },
    {
      title: '3. What we don’t do',
      body: 'No ads, no selling your data, no sharing with other companies except the hosting provider that stores it and the email service that sends our emails.',
    },
    {
      title: '4. Where it lives',
      body: 'On servers in the European Union, protected in transit and at rest.',
    },
    {
      title: '5. Your rights',
      body: 'You can see, correct and delete your data. Deleting your account in Settings removes everything permanently after 14 days.',
    },
    {
      title: '6. Contact',
      body: 'Privacy questions: hello@minimalist.hr.',
    },
  ],
};
