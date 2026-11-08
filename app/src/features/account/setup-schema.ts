import { z } from 'zod';

import { defaultRest } from '@/features/settings/default-rest';

export const nameMaxLength = 50;

/** A user's name. The API checks the same rules. */
export const userNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(nameMaxLength, `At most ${String(nameMaxLength)} characters.`);

/** The setup form. The API checks the same rules. */
export const setupSchema = z.object({
  name: userNameSchema,
  units: z.enum(['metric', 'imperial']),
  defaultRestSeconds: z
    .number()
    .int()
    .min(defaultRest.minSeconds)
    .max(defaultRest.maxSeconds)
    .multipleOf(defaultRest.stepSeconds),
});

export type SetupValues = z.input<typeof setupSchema>;
