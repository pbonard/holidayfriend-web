// GET /chat/turn: the TURN server and its credentials, valid for two hours
export interface TurnResponse {
  uris: string[];
  username: string;
  credential: string;
}

// what the two people of a call send each other over its socket, as mobile does
export type CallSignal =
  | { type: 'offer' | 'answer'; sdp: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }
  // the sender turned their microphone off, or on again
  | { type: 'mute' }
  | { type: 'leave' }
  // each one's name: an offer is answered with one's own
  | { type: 'name-offer' | 'name-answer'; name: string };

// what the call's socket brings. without a signal, fromIds are the others in the call, as one joins it or they do
export interface CallSignalResponse {
  fromIds: string[];
  signal?: CallSignal | null;
}
