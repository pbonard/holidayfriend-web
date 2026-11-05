import { useMutation } from '@tanstack/react-query';
import {
  confirmAuthenticatorSetup,
  loginWithAuthenticator,
  signInWithApple,
  signInWithGoogle,
  startAuthenticatorReset,
  startEmailLogin,
  verifyEmailOTP,
} from '@/api/auth';
import { EMAIL, START_OVER, VERIFICATION_ID } from '@/constants';
import { useAuthContext } from '@/contexts/AuthContext';

export function useSignInWithGoogle() {
  const { setAccessToken } = useAuthContext();
  return useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
    },
  });
}

export function useSignInWithApple() {
  const { setAccessToken } = useAuthContext();
  return useMutation({
    mutationFn: async (clientId: string) => {
      AppleID.auth.init({
        clientId,
        scope: 'email',
        redirectURI: `${window.location.origin}/login`,
        nonce: crypto.randomUUID(),
        usePopup: true,
      });
      const { authorization } = await AppleID.auth.signIn();
      return signInWithApple(authorization.id_token);
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
    },
  });
}

export function useStartEmailLogin() {
  const { setAuthenticatorSetup } = useAuthContext();
  return useMutation({
    mutationFn: (email: string) => startEmailLogin(email.trim()),
    onSuccess: (data, email) => {
      setAuthenticatorSetup(null);
      sessionStorage.setItem(EMAIL, email.trim());
      // a code mailed for another email must not be used for this one
      sessionStorage.removeItem(VERIFICATION_ID);
      if (data.verificationId) {
        sessionStorage.setItem(VERIFICATION_ID, data.verificationId);
      }
    },
  });
}

export function useStartAuthenticatorReset() {
  const { setAuthenticatorSetup } = useAuthContext();
  return useMutation({
    mutationFn: async () => {
      const email = sessionStorage.getItem(EMAIL);
      if (!email) {
        throw new Error(START_OVER);
      }
      try {
        return await startAuthenticatorReset(email);
      } catch (error) {
        // coming back within the cooldown, the code already mailed still works
        const verificationId = sessionStorage.getItem(VERIFICATION_ID);
        if (!verificationId) {
          throw error;
        }
        return { verificationId };
      }
    },
    onSuccess: (data) => {
      setAuthenticatorSetup(null);
      sessionStorage.setItem(VERIFICATION_ID, data.verificationId);
    },
  });
}

export function useResendEmailOTP(isReset: boolean) {
  return useMutation({
    mutationFn: async () => {
      const email = sessionStorage.getItem(EMAIL);
      if (!email) {
        throw new Error(START_OVER);
      }
      const data = await (isReset ? startAuthenticatorReset : startEmailLogin)(email);
      if (data.verificationId) {
        sessionStorage.setItem(VERIFICATION_ID, data.verificationId);
      }
    },
  });
}

export function useVerifyEmailOTP() {
  const { setAuthenticatorSetup } = useAuthContext();
  return useMutation({
    mutationFn: (otp: string) => {
      const verificationId = sessionStorage.getItem(VERIFICATION_ID);
      if (!verificationId) {
        throw new Error(START_OVER);
      }
      return verifyEmailOTP({ verificationId, otp });
    },
    onSuccess: (data) => {
      setAuthenticatorSetup(data);
      sessionStorage.removeItem(VERIFICATION_ID);
    },
  });
}

export function useConfirmAuthenticatorSetup() {
  const { authenticatorSetup, setAccessToken } = useAuthContext();
  return useMutation({
    mutationFn: (code: string) => {
      if (!authenticatorSetup) {
        throw new Error(START_OVER);
      }
      return confirmAuthenticatorSetup({ setupToken: authenticatorSetup.setupToken, code });
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      sessionStorage.removeItem(EMAIL);
    },
  });
}

export function useLoginWithAuthenticator() {
  const { setAccessToken } = useAuthContext();
  return useMutation({
    mutationFn: (code: string) => {
      const email = sessionStorage.getItem(EMAIL);
      if (!email) {
        throw new Error(START_OVER);
      }
      return loginWithAuthenticator({ email, code: code.trim() });
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      sessionStorage.removeItem(EMAIL);
    },
  });
}
