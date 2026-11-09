import { api, refreshTokens } from '@/api/client';
import { toApiError } from '@/api/problem';
import { queryClient } from '@/api/query-client';
import { clearStored } from '@/storage/phone-storage';

import { endSession, enterApp, readRefreshToken } from './session';
import { currentUserKey } from './use-current-user';

/** Removes what the app holds for the user who was signed in. */
export function clearUserData() {
  queryClient.clear();
  void clearStored().catch(() => undefined);
}

/** Signs out on this phone even without a connection. The token then runs out by itself. */
export async function signOut() {
  const refreshToken = await readRefreshToken();
  if (refreshToken !== null) {
    await api
      .POST('/api/v1/sessions/revoke', { body: { refreshToken } })
      .catch(() => undefined);
  }

  await endSession();
}

/**
 * With new tokens saved, asks the API who is signed in, then shows setup or the app.
 * @throws When the API gives no answer, for example without a connection.
 */
export async function enterSignedIn() {
  const { data, error, response } = await api.GET('/api/v1/users/me');
  if (data !== undefined) {
    // Kept for the first screen, which then knows the units and the name.
    queryClient.setQueryData(currentUserKey, data);
    // A user without a name has not finished setup.
    enterApp(data.name !== null);
    return;
  }

  // The tokens no longer work, or the account is gone.
  if (response.status === 401 || response.status === 404) {
    await endSession();
    return;
  }

  throw toApiError(error);
}

/**
 * At launch: signs in again with the stored refresh token, or shows sign in when there is none or it no longer works.
 * @throws When the API gives no answer. The token is kept, so trying again can still work.
 */
export async function restoreSession() {
  if (!(await refreshTokens())) {
    await endSession();
    return;
  }

  await enterSignedIn();
}
