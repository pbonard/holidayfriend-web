// phone login, not used by the web app. To bring it back:
// - npm install libphonenumber-js
// - move app/signup/phone to src/app/(auth)/signup/phone, components to src/components, and this file to src/api
// - add setAccessToken to src/api/auth.ts, and set twilio: true on auth in values-holidayfriend.yaml of the chart
// - after google sign in, a response with sessionId means the phone must be verified, send it to /signup/phone
import { axiosInstance } from '@/api/axios';
import { setAccessToken } from '@/api/auth';

// the signup steps are separate pages, sessionStorage keeps their state across them and a page reload
const SESSION_ID = 'sessionId';
const VERIFICATION_ID = 'verificationId';
const PHONE_NUMBER = 'phoneNumber';

export function clearSignupSteps() {
  sessionStorage.removeItem(SESSION_ID);
  sessionStorage.removeItem(VERIFICATION_ID);
  sessionStorage.removeItem(PHONE_NUMBER);
}

export async function sendSMSOTP(phoneNumber: string) {
  const { data } = await axiosInstance.post<{ verificationId: string }>(
    '/auth/sms/otp/send',
    { phoneNumber, sessionId: sessionStorage.getItem(SESSION_ID) },
  );
  sessionStorage.setItem(VERIFICATION_ID, data.verificationId);
  sessionStorage.setItem(PHONE_NUMBER, phoneNumber);
}

export async function resendSMSOTP() {
  const phoneNumber = sessionStorage.getItem(PHONE_NUMBER);
  if (!phoneNumber) {
    throw new Error('Go back and enter your phone number again');
  }
  await sendSMSOTP(phoneNumber);
}

export async function verifySMSOTP(otp: string) {
  const verificationId = sessionStorage.getItem(VERIFICATION_ID);
  if (!verificationId) {
    throw new Error('Go back and enter your phone number again');
  }
  const { data } = await axiosInstance.post<{ accessToken: string }>(
    '/auth/sms/otp/verify',
    { otp, verificationId, sessionId: sessionStorage.getItem(SESSION_ID) },
  );
  setAccessToken(data.accessToken);
  clearSignupSteps();
}
