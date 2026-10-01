import { createCognitoClient } from './cognito';
export const auth = createCognitoClient({
  region: import.meta.env.VITE_COGNITO_REGION,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});
