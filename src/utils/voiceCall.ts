import { getAccessToken } from '@/api/axios';
import { getTurn, openCallSocket } from '@/api/call';
import type { CallSignal, CallSignalResponse } from '@/types/call';

// a voice call with the other person of a chat, speaking mobile's protocol: both join the call's socket, whoever has
// the larger id offers, and the sound then goes between the two browsers, or through the TURN server. nobody is rung:
// the other person joins by calling too

const STUN_SERVER: RTCIceServer = { urls: 'stun:stun.l.google.com:19302' };

type VoiceCallStatus =
  // asking for the microphone and joining
  | 'starting'
  | 'waiting'
  | 'connecting'
  | 'connected'
  // the sound stopped coming, it may come back by itself
  | 'reconnecting'
  // the other person hung up, or their connection was lost: still in the call, they can join again
  | 'left'
  | 'lost';

export interface VoiceCallState {
  status: VoiceCallStatus;
  // whether one's own microphone is off, and theirs
  muted: boolean;
  otherMuted: boolean;
  // when the two were connected, Date.now(). null while they aren't
  connectedAt: number | null;
}

export interface VoiceCallActions {
  toggleMute: () => void;
  hangUp: () => void;
}

type VoiceCallOptions = {
  myId: string;
  myName: string;
  otherId: string;
  onChange: (state: VoiceCallState) => void;
  // once, when it's over: hung up, or with what went wrong, short as it's shown in the chat's header
  onEnd: (error?: string) => void;
};

type Peer = {
  connection: RTCPeerConnection;
  // whether the socket already told that they joined. their offer can come before that
  announced: boolean;
  // whether they were told one's name, and that one is muted if so. a mute only says it changed, so one sent before
  // and again then would leave them thinking the opposite
  introduced: boolean;
};

export const STARTING: VoiceCallState = {
  status: 'starting',
  muted: false,
  otherMuted: false,
  connectedAt: null,
};

// whether this browser can call at all: the call button shows only then. no microphone outside https and localhost
export function canCall() {
  return (
    typeof window !== 'undefined' &&
    typeof RTCPeerConnection !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

// without the TURN server a call still connects, unless both networks are strict. a chat server without one
// configured answers "turn::3478", which RTCPeerConnection throws on
async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const { uris, username, credential } = await getTurn();
    const urls = uris.filter((uri) => !/^turns?::/.test(uri));
    return urls.length > 0
      ? [STUN_SERVER, { urls, username, credential }]
      : [STUN_SERVER];
  } catch {
    return [STUN_SERVER];
  }
}

// call it from a click: the browser then lets the other person's voice play
export function startVoiceCall({
  myId,
  myName,
  otherId,
  onChange,
  onEnd,
}: VoiceCallOptions): VoiceCallActions {
  const audio = new Audio();
  audio.autoplay = true;
  let state = STARTING;
  let ended = false;
  let microphone: MediaStream | null = null;
  let iceServers: RTCIceServer[] = [];
  let socket: WebSocket | null = null;
  let peer: Peer | null = null;
  // candidates that came before the description they go with
  let candidates: RTCIceCandidateInit[] = [];
  // the socket's messages one after another, each waits for the one before it
  let received = Promise.resolve();

  const update = (changes: Partial<VoiceCallState>) => {
    if (ended) return;
    state = { ...state, ...changes };
    onChange(state);
  };

  const send = (signal: CallSignal | RTCSessionDescription) => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ toIds: [otherId], signal }));
  };

  const closePeer = () => {
    peer?.connection.close();
    peer = null;
    audio.srcObject = null;
  };

  const end = (error?: string) => {
    if (ended) return;
    ended = true;
    if (peer) send({ type: 'leave' });
    closePeer();
    microphone?.getTracks().forEach((track) => track.stop());
    socket?.close();
    onEnd(error);
  };

  // they're gone, the call waits for them to join again
  const dropPeer = (status: 'left' | 'lost') => {
    closePeer();
    candidates = [];
    // without the socket it wouldn't hear of them again
    if (socket?.readyState !== WebSocket.OPEN) {
      end('Call disconnected');
      return;
    }
    update({ status, otherMuted: false, connectedAt: null });
  };

  const createPeer = (announced: boolean) => {
    closePeer();
    const connection = new RTCPeerConnection({ iceServers });
    const created: Peer = { connection, announced, introduced: false };
    peer = created;
    microphone?.getTracks().forEach((track) => {
      if (microphone) connection.addTrack(track, microphone);
    });
    connection.onicecandidate = ({ candidate }) => {
      // an empty one only says there are no more
      if (candidate?.candidate) {
        send({ type: 'candidate', candidate: candidate.toJSON() });
      }
    };
    connection.ontrack = ({ track }) => {
      audio.srcObject = new MediaStream([track]);
      audio.play().catch(() => {});
    };
    connection.onconnectionstatechange = () => {
      if (peer !== created) return;
      switch (connection.connectionState) {
        case 'connected':
          update({
            status: 'connected',
            connectedAt: state.connectedAt ?? Date.now(),
          });
          break;
        case 'disconnected':
          update({ status: 'reconnecting' });
          break;
        case 'failed':
          dropPeer('lost');
          break;
      }
    };
    update({ status: 'connecting', otherMuted: false, connectedAt: null });
    return created;
  };

  const addCandidate = async (
    connection: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ) => {
    try {
      await connection.addIceCandidate(candidate);
    } catch {
      // one of a connection from before, or none this browser can use: the others may do
    }
  };

  const setRemote = async (
    connection: RTCPeerConnection,
    description: RTCSessionDescriptionInit,
  ) => {
    await connection.setRemoteDescription(description);
    const early = candidates;
    candidates = [];
    await Promise.all(
      early.map((candidate) => addCandidate(connection, candidate)),
    );
  };

  // they're in the call, as one joins it or they do. again when they joined anew: that's a new connection
  const onJoined = async () => {
    const offered = peer !== null && !peer.announced;
    const joined = peer && offered ? peer : createPeer(true);
    joined.announced = true;
    joined.introduced = true;
    send({ type: 'name-offer', name: myName });
    // they start from thinking one isn't muted
    if (state.muted) send({ type: 'mute' });
    if (!offered && myId > otherId) {
      const { connection } = joined;
      await connection.setLocalDescription(await connection.createOffer());
      if (connection.localDescription) send(connection.localDescription);
    }
  };

  const onOffer = async (offer: RTCSessionDescriptionInit) => {
    // one connection takes one offer: another is from a new connection of theirs
    const fresh =
      peer &&
      peer.connection.signalingState === 'stable' &&
      !peer.connection.remoteDescription;
    const { connection } = peer && fresh ? peer : createPeer(false);
    await setRemote(connection, offer);
    await connection.setLocalDescription(await connection.createAnswer());
    if (connection.localDescription) send(connection.localDescription);
  };

  const receive = async (data: string) => {
    if (ended) return;
    const { fromIds, signal } = JSON.parse(data) as CallSignalResponse;
    // the server lets anyone into a call they know the id of: only the other person of the chat is heard
    if (!fromIds.includes(otherId)) return;
    if (!signal) {
      await onJoined();
      return;
    }
    switch (signal.type) {
      case 'offer':
        await onOffer({ type: 'offer', sdp: signal.sdp });
        break;
      case 'answer':
        if (peer) {
          await setRemote(peer.connection, { type: 'answer', sdp: signal.sdp });
        }
        break;
      case 'candidate':
        if (peer?.connection.remoteDescription) {
          await addCandidate(peer.connection, signal.candidate);
        } else {
          candidates.push(signal.candidate);
        }
        break;
      case 'name-offer':
        // mobile shows it. their name is the chat's here
        send({ type: 'name-answer', name: myName });
        break;
      case 'mute':
        update({ otherMuted: !state.otherMuted });
        break;
      case 'leave':
        dropPeer('left');
        break;
    }
  };

  const connect = async (stale: boolean) => {
    let token: string;
    try {
      token = await getAccessToken({ stale });
    } catch {
      end("Couldn't start the call");
      return;
    }
    if (ended) return;
    const opening = openCallSocket(token, myId, otherId);
    socket = opening;
    let opened = false;
    opening.onopen = () => {
      opened = true;
      update({ status: 'waiting' });
    };
    opening.onmessage = (event: MessageEvent<string>) => {
      received = received
        .then(() => receive(event.data))
        // chat writes its errors as plain text before closing. a signal of a connection already closed fails too
        .catch(() => {});
    };
    opening.onclose = () => {
      if (ended) return;
      if (!opened) {
        // the gateway may have turned its token away: once more with a new one
        if (stale) end("Couldn't start the call");
        else void connect(true);
        return;
      }
      // the two still hear each other without it, until their connection fails (dropPeer)
      if (peer?.connection.connectionState === 'connected') return;
      end('Call disconnected');
    };
  };

  const start = async () => {
    try {
      microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      end("Can't use the microphone");
      return;
    }
    if (ended) {
      microphone.getTracks().forEach((track) => track.stop());
      return;
    }
    // muted while the browser was still asking
    microphone.getAudioTracks().forEach((track) => {
      track.enabled = !state.muted;
    });
    iceServers = await getIceServers();
    if (!ended) await connect(false);
  };

  void start();

  return {
    toggleMute: () => {
      const muted = !state.muted;
      microphone?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      if (peer?.introduced) send({ type: 'mute' });
      update({ muted });
    },
    hangUp: () => end(),
  };
}
