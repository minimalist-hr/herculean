import type { useTheme } from '@/theme/theme-provider';

import type { TicketStatus, TicketType } from './use-feedback';

export const typeLabels: Record<TicketType, string> = {
  bug: 'Bug',
  suggestion: 'Suggestion',
  other: 'Other',
};

export const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  answered: 'Answered',
  closed: 'Closed',
};

/** Open waits for Minimalist in the accent, answered is green, and closed is done. */
export function statusColor(
  status: TicketStatus,
  colors: ReturnType<typeof useTheme>['colors'],
) {
  return {
    open: colors.primaryText,
    answered: colors.success,
    closed: colors.muted,
  }[status];
}

/** The page a ticket opened from, for its back link. */
export function backLabel(from?: string) {
  return from === 'home' ? 'Home' : 'Your feedback';
}

/** What a page's actions say before it has loaded. */
export const notLoadedMessage = 'This page hasn’t loaded yet.';

export const closedMessage =
  'This feedback is closed. Send new feedback instead.';

/** What sending says once Minimalist blocked the user. Must match F18 and F28. */
export const blockedMessage = 'You can’t send feedback right now.';

export const limitReachedMessage =
  'You’ve sent a lot of feedback today. Try again tomorrow.';
