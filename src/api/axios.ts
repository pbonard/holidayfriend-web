import axios, { type AxiosError } from 'axios';

// same origin, next.config.ts proxies /auth to the backend so the refresh_token cookie is first party
export const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

// the backend answers errors in plain text, the forms show it instead of axios's "Request failed with status code"
axiosInstance.interceptors.response.use(undefined, (error: AxiosError) => {
  const message = error.response?.data;
  if (typeof message === 'string' && message) {
    return Promise.reject(new Error(message));
  }
  return Promise.reject(error);
});
