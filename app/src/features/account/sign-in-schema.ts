import { z } from 'zod';

/** The sign in form. It only checks that both are there; the account's own rules are not repeated. */
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type SignInValues = z.input<typeof signInSchema>;
