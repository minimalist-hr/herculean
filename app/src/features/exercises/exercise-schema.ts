import { z } from 'zod';

/** The exercise form. The API also checks the name against the user's other exercises. */
export const exerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(100, 'At most 100 characters.'),
  groupId: z.string().min(1, 'Choose a group.'),
  alsoWorksGroupIds: z.array(z.string()),
});

export type ExerciseValues = z.input<typeof exerciseSchema>;
