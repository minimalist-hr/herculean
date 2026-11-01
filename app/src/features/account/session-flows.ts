import { api, refreshTokens } from '@/api/client';
import { toApiError } from '@/api/problem';

import { endSession, enterApp } from './session';

/**
 * With new tokens saved, asks the API who is signed in, then shows setup or the app.
 * @throws When the API gives no answer, for example without a connection.
 */
export async function enterSignedIn() {
  const { data, error, response } = await api.GET('/api/v1/users/me');
  if (data !== undefined) {
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
