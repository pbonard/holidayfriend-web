import { useEffect, useRef, useState } from 'react';
import { useMyProfileBrief } from '@/hooks/useProfile';
import {
  STARTING,
  startVoiceCall,
  type VoiceCallActions,
  type VoiceCallState,
} from '@/utils/voiceCall';

// how long why a call ended is shown
const ERROR_MS = 8 * 1000;

// the voice call of a chat. call is null while there's none, error is why the last one ended, when not by hanging up
export function useVoiceCall(roomId: string) {
  const me = useMyProfileBrief().data;
  const callRef = useRef<VoiceCallActions | null>(null);
  const [call, setCall] = useState<VoiceCallState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // leaving the chat hangs up, as on mobile: also when next only hides it (cacheComponents), and closing the tab,
  // so the other person doesn't wait for the connection to fail
  useEffect(() => {
    const hangUp = () => callRef.current?.hangUp();
    window.addEventListener('pagehide', hangUp);
    return () => {
      window.removeEventListener('pagehide', hangUp);
      hangUp();
    };
  }, []);

  useEffect(() => {
    if (error === null) return;
    const timer = setTimeout(() => setError(null), ERROR_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const start = () => {
    if (!me || callRef.current) return;
    setError(null);
    setCall(STARTING);
    callRef.current = startVoiceCall({
      myId: me.id,
      myName: me.name,
      otherId: roomId,
      onChange: setCall,
      onEnd: (reason) => {
        callRef.current = null;
        setCall(null);
        setError(reason ?? null);
      },
    });
  };

  return {
    call,
    error,
    ready: Boolean(me),
    start,
    toggleMute: () => callRef.current?.toggleMute(),
    hangUp: () => callRef.current?.hangUp(),
  };
}
