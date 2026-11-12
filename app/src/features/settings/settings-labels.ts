import type { components } from '@/api/schema';

type Schemas = components['schemas'];

export const themeLabels: Record<Schemas['Theme'], string> = {
  default: 'Default',
  mono: 'Mono',
  emerald: 'Emerald',
  smoke: 'Smoke',
  paper: 'Paper',
  fjord: 'Fjord',
  latte: 'Latte',
  frost: 'Frost',
};

export const unitLabels: Record<Schemas['Units'], string> = {
  metric: 'Metric',
  imperial: 'Imperial',
};

/** The avatar's letters: the first and last names' first letters, or the email's first. */
export function initialsOf(name: string | null, email: string) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return email.charAt(0).toUpperCase();
  }

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';

  return `${first}${last}`.toUpperCase();
}
