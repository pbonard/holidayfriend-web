import { axiosInstance } from '@/api/axios';
import type { AuthenticatorSetup } from '@/types/auth';

export async function signInWithGoogle(
  idToken: string,
): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post('/auth/email/google', { idToken });
  return data;
}

export async function signInWithApple(
  identityToken: string,
): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post('/auth/email/apple', {
    identityToken,
  });
  return data;
}

export async function startEmailLogin(
  email: string,
): Promise<{ isSignup: boolean; verificationId?: string }> {
  const { data } = await axiosInstance.post('/auth/email/login/start', {
    email,
  });
  return data;
}

// proves the email, signing in only comes after the authenticator is set up
export async function verifyEmailOTP(body: {
  verificationId: string;
  otp: string;
}): Promise<AuthenticatorSetup> {
  const { data } = await axiosInstance.post(
    '/auth/email/login/otp/verify',
    body,
  );
  return data;
}

// signs in
export async function confirmAuthenticatorSetup(body: {
  setupToken: string;
  code: string;
}): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post(
    '/auth/email/login/totp/confirm',
    body,
  );
  return data;
}

export async function loginWithAuthenticator(body: {
  email: string;
  code: string;
}): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post(
    '/auth/email/login/totp/verify',
    body,
  );
  return data;
}

// mails a code to prove the email, the old authenticator keeps working until a new one is confirmed
export async function startAuthenticatorReset(
  email: string,
): Promise<{ verificationId: string }> {
  const { data } = await axiosInstance.post('/auth/email/login/reset/start', {
    email,
  });
  return data;
}
