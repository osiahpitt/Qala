export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  iceTransportPolicy: RTCIceTransportPolicy;
}

export interface MediaQuality {
  video: {
    width: number;
    height: number;
    frameRate: number;
  };
  audio: {
    sampleRate: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
  };
}

export const MEDIA_QUALITIES: Record<'high' | 'medium' | 'low', MediaQuality> = {
  high: {
    video: {
      width: 1280,
      height: 720,
      frameRate: 30,
    },
    audio: {
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  },
  medium: {
    video: {
      width: 640,
      height: 480,
      frameRate: 24,
    },
    audio: {
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  },
  low: {
    video: {
      width: 320,
      height: 240,
      frameRate: 15,
    },
    audio: {
      sampleRate: 48000,
      echoCancellation: true,
      noiseSuppression: true,
    },
  },
};

export const getWebRTCConfig = (): WebRTCConfig => {
  const stunServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
  ];

  const iceServers = [...stunServers];

  // Add TURN server if configured
  if (
    process.env.NEXT_PUBLIC_TURN_SERVER_URL &&
    process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME &&
    process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL
  ) {
    iceServers.push({
      urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
      username: process.env.NEXT_PUBLIC_TURN_SERVER_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_SERVER_CREDENTIAL,
    } as RTCIceServer);
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
  };
};

export const getMediaConstraints = (quality: 'high' | 'medium' | 'low'): MediaStreamConstraints => {
  const mediaQuality = MEDIA_QUALITIES[quality];

  return {
    video: {
      width: { ideal: mediaQuality.video.width },
      height: { ideal: mediaQuality.video.height },
      frameRate: { ideal: mediaQuality.video.frameRate },
      facingMode: 'user',
    },
    audio: {
      sampleRate: { ideal: mediaQuality.audio.sampleRate },
      echoCancellation: mediaQuality.audio.echoCancellation,
      noiseSuppression: mediaQuality.audio.noiseSuppression,
      autoGainControl: true,
    },
  };
};