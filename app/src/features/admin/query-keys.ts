export const inboxKeys = {
  all: ['inbox'] as const,
  list: (filter: string) => ['inbox', 'list', filter] as const,
  ticket: (id: string) => ['inbox', 'ticket', id] as const,
};
