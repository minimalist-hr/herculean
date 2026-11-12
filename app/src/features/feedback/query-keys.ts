export const feedbackKeys = {
  all: ['feedback'] as const,
  list: ['feedback', 'list'] as const,
  unread: ['feedback', 'unread'] as const,
  block: ['feedback', 'block'] as const,
  ticket: (id: string) => ['feedback', 'ticket', id] as const,
  screenshot: (ticketId: string, id: string) =>
    ['feedback', 'ticket', ticketId, 'screenshot', id] as const,
};
