import { axiosInstance } from '@/api/axios';

// kept out of storage so scripts can't read it back after a reload, the refresh_token cookie renews it
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export async function signInWithGoogle(idToken: string) {
  const { data } = await axiosInstance.post<{ accessToken: string }>(
    '/auth/email/google',
    { idToken },
  );
  accessToken = data.accessToken;
}
