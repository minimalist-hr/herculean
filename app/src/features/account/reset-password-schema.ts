import { z } from 'zod';

/** The form that asks for a reset link. */
export const resetPasswordSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email.')),
});

export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
