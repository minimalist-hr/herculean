import { z } from 'zod';

import {
  passwordMaxLength,
  passwordMinLength,
  passwordTooLong,
} from './create-account-schema';

/** The new password form. The API checks one password; the form also checks that both match. */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(passwordMinLength, 'At least 8 characters.')
      .max(passwordMaxLength, passwordTooLong),
    repeatPassword: z.string(),
  })
  .refine((values) => values.password === values.repeatPassword, {
    error: 'The passwords don’t match.',
    path: ['repeatPassword'],
  });

export type NewPasswordValues = z.input<typeof newPasswordSchema>;
