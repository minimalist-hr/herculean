import { ScrollView } from 'react-native';

import { Chip } from '@/components/chip';
import { notifyFailure } from '@/components/notifications';
import { useTheme } from '@/theme/theme-provider';

import { statusLabels } from './feedback-labels';
import type { TicketStatus } from './use-feedback';

/** A status, or every ticket. */
export type StatusFilter = TicketStatus | 'all';

const filters: StatusFilter[] = ['all', 'open', 'answered', 'closed'];

/** What an empty list says, for each filter. */
export const emptyTitles: Record<StatusFilter, string> = {
  all: 'No feedback yet',
  open: 'Nothing open',
  answered: 'Nothing answered',
  closed: 'Nothing closed',
};

/** Whether a ticket shows under a filter. */
export function inFilter(status: TicketStatus, filter: StatusFilter) {
  return filter === 'all' || status === filter;
}

/** All, Open, Answered and Closed, on one line that scrolls sideways, from the screen's edge. */
export function StatusChips({
  selected,
  onSelect,
  mutedReason,
}: {
  selected: StatusFilter;
  onSelect: (filter: StatusFilter) => void;
  /** Why they can't be used now. They then look muted and say so when tapped. */
  mutedReason?: string;
}) {
  const { size } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: size.gap.chips,
        paddingHorizontal: size.sidePadding,
      }}
    >
      {filters.map((filter) => (
        <Chip
          key={filter}
          label={filter === 'all' ? 'All' : statusLabels[filter]}
          selected={selected === filter}
          muted={mutedReason !== undefined}
          onPress={() => {
            if (mutedReason === undefined) {
              onSelect(filter);
            } else {
              notifyFailure(mutedReason);
            }
          }}
        />
      ))}
    </ScrollView>
  );
}
