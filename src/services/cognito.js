export function createCognitoClient({
  region,
  clientId,
  fetchImpl = globalThis.fetch,
  now = Date.now,
}) {
  let session = null;
  let generation = 0;
  let refreshPending = null;
  const expiredListeners = new Set();
  function expireSession() {
    generation++;
    session = null;
    refreshPending = null;
    for (const listener of expiredListeners) listener();
  }
  async function call(action, body) {
    if (!/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(region || '') || !clientId)
      throw new Error(
        'Configure VITE_COGNITO_REGION and VITE_COGNITO_CLIENT_ID to match the backend Cognito pool and public app client.',
      );
    let response;
    try {
      response = await fetchImpl(`https://cognito-idp.${region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
        },
        body: JSON.stringify({ ClientId: clientId, ...body }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        'Could not reach the account service. Check your connection and try again.',
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('The account service returned an unreadable response. Try again.');
    }
    if (!response.ok) {
      const error = new Error(data.message || 'Account request failed.');
      error.code = (data.__type || '').split('#').at(-1);
      throw error;
    }
    return data;
  }
  function store(result) {
    if (
      !result?.AccessToken ||
      !Number.isFinite(Number(result.ExpiresIn)) ||
      Number(result.ExpiresIn) <= 0
    )
      throw new Error(
        'The account service did not return a valid access token and expiry.',
      );
    session = {
      accessToken: result.AccessToken,
      refreshToken: result.RefreshToken || session?.refreshToken,
      expiresAt: now() + Number(result.ExpiresIn || 3600) * 1000,
    };
  }
  return {
    getSessionGeneration: () => generation,
    onSessionExpired(listener) {
      expiredListeners.add(listener);
      return () => expiredListeners.delete(listener);
    },
    rejectAccessToken(token, requestGeneration) {
      if (requestGeneration === generation && session?.accessToken === token)
        expireSession();
    },
    register: ({ email, password, name }) =>
      call('SignUp', {
        Username: email.trim(),
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email.trim() },
          { Name: 'name', Value: name.trim() },
        ],
      }),
    confirm: (email, code) =>
      call('ConfirmSignUp', { Username: email.trim(), ConfirmationCode: code.trim() }),
    resend: (email) => call('ResendConfirmationCode', { Username: email.trim() }),
    async login({ email, password }) {
      const attempt = ++generation;
      session = null;
      refreshPending = null;
      const result = await call('InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: email.trim(), PASSWORD: password },
      });
      if (attempt !== generation)
        throw new Error('Login was cancelled. Please log in again.');
      if (result.ChallengeName)
        throw new Error(
          `Your account requires ${result.ChallengeName}. This additional login challenge is not supported by this POC yet.`,
        );
      store(result.AuthenticationResult);
    },
    async getAccessToken() {
      const attempt = generation;
      if (!session) throw new Error('Log in before using the backend API.');
      if (session.expiresAt <= now() + 30000) {
        if (!session.refreshToken) {
          expireSession();
          throw new Error('Your session expired. Please log in again.');
        }
        if (!refreshPending) {
          const currentSession = session;
          const pending = (async () => {
            try {
              const result = await call('InitiateAuth', {
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                AuthParameters: { REFRESH_TOKEN: currentSession.refreshToken },
              });
              if (attempt !== generation) throw new Error('Session changed.');
              store(result.AuthenticationResult);
            } catch (error) {
              if (attempt !== generation)
                throw new Error('Your session expired. Please log in again.');
              if (
                ['NotAuthorizedException', 'UserNotFoundException'].includes(error.code)
              ) {
                expireSession();
                throw new Error('Your session expired. Please log in again.');
              }
              throw error;
            }
          })();
          refreshPending = pending;
          pending
            .finally(() => {
              if (refreshPending === pending) refreshPending = null;
            })
            .catch(() => {});
        }
        await refreshPending;
      }
      if (attempt !== generation || !session)
        throw new Error('Session changed. Please log in again.');
      return session.accessToken;
    },
    logout() {
      generation++;
      session = null;
      refreshPending = null;
    },
  };
}
