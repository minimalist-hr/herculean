import { z } from 'zod';

export const passwordMinLength = 8;

/** The create account form. The API checks one password; the form also checks that both match. */
export const createAccountSchema = z
  .object({
    email: z.string().trim().pipe(z.email('Enter a valid email.')),
    password: z.string().min(passwordMinLength, 'At least 8 characters.'),
    repeatPassword: z.string(),
  })
  .refine((values) => values.password === values.repeatPassword, {
    error: 'The passwords don’t match.',
    path: ['repeatPassword'],
  });

export type CreateAccountValues = z.input<typeof createAccountSchema>;
