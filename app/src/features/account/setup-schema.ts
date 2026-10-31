import { z } from 'zod';

import { defaultRest } from '@/features/settings/default-rest';

export const nameMaxLength = 50;

/** The setup form. The API checks the same rules. */
export const setupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(nameMaxLength, `At most ${String(nameMaxLength)} characters.`),
  units: z.enum(['metric', 'imperial']),
  defaultRestSeconds: z
    .number()
    .int()
    .min(defaultRest.minSeconds)
    .max(defaultRest.maxSeconds)
    .multipleOf(defaultRest.stepSeconds),
});

export type SetupValues = z.input<typeof setupSchema>;
