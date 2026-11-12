export const inboxKeys = {
  all: ['inbox'] as const,
  list: (filter: string) => ['inbox', 'list', filter] as const,
  userList: (userId: string) => ['inbox', 'list', 'user', userId] as const,
  ticket: (id: string) => ['inbox', 'ticket', id] as const,
};

export const userKeys = {
  all: ['admin-users'] as const,
  list: (filter: string, search: string) =>
    ['admin-users', 'list', filter, search] as const,
  user: (id: string) => ['admin-users', 'user', id] as const,
  training: (id: string) => ['admin-users', 'training', id] as const,
  photo: (id: string) => ['admin-users', 'photo', id] as const,
};
