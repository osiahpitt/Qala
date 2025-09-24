declare module 'simple-peer' {
  interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: RTCDataChannelInit;
    channelName?: string;
    config?: RTCConfiguration;
    constraints?: MediaStreamConstraints;
    objectMode?: boolean;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    iceCompleteTimeout?: number;
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
  }

  interface SimplePeerSignal {
    type?: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
    candidate?: RTCIceCandidateInit;
    renegotiate?: boolean;
    transceiverRequest?: {
      kind: string;
      init: RTCRtpTransceiverInit;
    };
  }

  interface SimplePeerData {
    [key: string]: unknown;
  }

  class SimplePeer extends NodeJS.EventEmitter {
    static WEBRTC_SUPPORT: boolean;

    readonly bufferSize: number;
    readonly channelName: string;
    readonly connected: boolean;
    readonly connecting: boolean;
    readonly destroyed: boolean;
    readonly initiator: boolean;
    readonly readable: boolean;
    readonly writable: boolean;
    readonly _pc: RTCPeerConnection;
    readonly remoteAddress: string;
    readonly remoteFamily: string;
    readonly remotePort: number;
    readonly streams: ReadonlyArray<MediaStream>;

    constructor(opts?: SimplePeerOptions);

    addStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    addTransceiver(trackOrKind: MediaStreamTrack | string, init?: RTCRtpTransceiverInit): RTCRtpTransceiver;
    createDataChannel(label: string, opts?: RTCDataChannelInit): RTCDataChannel;
    destroy(err?: Error): void;
    getStats(callback: (err: Error | null, reports?: RTCStatsReport[]) => void): void;
    removeStream(stream: MediaStream): void;
    removeTrack(sender: RTCRtpSender): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): Promise<void>;
    send(chunk: string | Buffer | ArrayBuffer | ArrayBufferView): void;
    signal(data: SimplePeerSignal): void;

    // Events
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: SimplePeerData) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'signal', listener: (data: SimplePeerSignal) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'close', listener: () => void): this;

    once(event: 'connect', listener: () => void): this;
    once(event: 'data', listener: (data: SimplePeerData) => void): this;
    once(event: 'stream', listener: (stream: MediaStream) => void): this;
    once(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    once(event: 'signal', listener: (data: SimplePeerSignal) => void): this;
    once(event: 'error', listener: (err: Error) => void): this;
    once(event: 'close', listener: () => void): this;

    emit(event: 'connect'): boolean;
    emit(event: 'data', data: SimplePeerData): boolean;
    emit(event: 'stream', stream: MediaStream): boolean;
    emit(event: 'track', track: MediaStreamTrack, stream: MediaStream): boolean;
    emit(event: 'signal', data: SimplePeerSignal): boolean;
    emit(event: 'error', err: Error): boolean;
    emit(event: 'close'): boolean;
  }

  export = SimplePeer;
}