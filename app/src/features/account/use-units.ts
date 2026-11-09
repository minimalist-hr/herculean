import { useCurrentUser } from './use-current-user';

/** The units every weight and volume shows in. The user is read before any screen opens, so this is right from the first frame. */
export function useUnits() {
  return useCurrentUser().data?.units ?? 'metric';
}
