import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// same origin, next.config.ts proxies /auth to the backend so the refresh_token cookie is first party
export const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

export class NotLoggedInError extends Error {}

const REFRESH_URL = '/auth/refresh-token';
// the refresh's own answer when there is no cookie (400) or it is no longer valid (401), other failures say nothing about the session
const NOT_LOGGED_IN_STATUSES = [400, 401];

// only in memory, so a page reload gets a new one through the refresh_token cookie. only ever set in the browser
let accessToken: string | null = null;
let refreshing: Promise<void> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

// requests failing at the same time wait for the same refresh
function refreshAccessToken() {
  refreshing ??= axiosInstance
    .post<{ accessToken: string }>(REFRESH_URL)
    .then(({ data }) => {
      accessToken = data.accessToken;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// they don't take the token, and their 401 means a wrong code or password rather than an expired token
function isAuthRequest(url?: string) {
  return url?.startsWith('/auth/') ?? false;
}

axiosInstance.interceptors.request.use(async (config) => {
  if (isAuthRequest(config.url)) {
    return config;
  }
  if (!accessToken) {
    await refreshAccessToken();
  }
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

axiosInstance.interceptors.response.use(
  undefined,
  async (error: AxiosError) => {
    const request = error.config as
      | (InternalAxiosRequestConfig & { retried?: boolean })
      | undefined;
    if (
      request?.url === REFRESH_URL &&
      NOT_LOGGED_IN_STATUSES.includes(error.response?.status ?? 0)
    ) {
      return Promise.reject(new NotLoggedInError());
    }
    if (
      error.response?.status === 401 &&
      request &&
      !request.retried &&
      !isAuthRequest(request.url)
    ) {
      request.retried = true;
      accessToken = null;
      return axiosInstance(request);
    }
    // the backend answers errors in plain text, the forms show it instead of axios's "Request failed with status code"
    const message = error.response?.data;
    if (typeof message === 'string' && message) {
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
