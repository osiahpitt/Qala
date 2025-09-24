import SimplePeer from 'simple-peer';
import type { SimplePeerData, SignalData } from 'simple-peer';
import { getWebRTCConfig, getMediaConstraints } from './config';
import { logger } from '@/lib/utils/logger';

export interface ConnectionQuality {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  connectionType: 'direct' | 'relay';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PeerConnectionEvents {
  signal: (data: SignalData) => void;
  stream: (stream: MediaStream) => void;
  connect: () => void;
  error: (error: Error) => void;
  close: () => void;
  data: (data: unknown) => void;
  connectionQuality: (quality: ConnectionQuality) => void;
}

export class PeerConnectionManager {
  private peer: SimplePeer | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private qualityMonitorInterval: NodeJS.Timeout | null = null;
  private currentQuality: 'high' | 'medium' | 'low' = 'high';
  private eventListeners: Partial<PeerConnectionEvents> = {};

  constructor(private isInitiator: boolean) {
    this.setupPeerConnection();
  }

  private setupPeerConnection(): void {
    const config = getWebRTCConfig();

    this.peer = new SimplePeer({
      initiator: this.isInitiator,
      trickle: true,
      config: {
        iceServers: config.iceServers,
        iceCandidatePoolSize: config.iceCandidatePoolSize,
        iceTransportPolicy: config.iceTransportPolicy,
      },
      stream: this.localStream || undefined,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.peer) return;

    this.peer.on('signal', (data) => {
      logger.debug('WebRTC signal generated:', data);
      this.eventListeners.signal?.(data);
    });

    this.peer.on('connect', () => {
      logger.info('WebRTC connection established');
      this.eventListeners.connect?.();
      this.startQualityMonitoring();
    });

    this.peer.on('stream', (stream) => {
      logger.info('Remote stream received');
      this.remoteStream = stream;
      this.eventListeners.stream?.(stream);
    });

    this.peer.on('data', (data) => {
      this.eventListeners.data?.(data);
    });

    this.peer.on('error', (error) => {
      logger.error('WebRTC error:', error);
      this.eventListeners.error?.(error);
      this.cleanup();
    });

    this.peer.on('close', () => {
      logger.info('WebRTC connection closed');
      this.eventListeners.close?.();
      this.cleanup();
    });
  }

  async setLocalStream(quality: 'high' | 'medium' | 'low' = 'high'): Promise<MediaStream> {
    try {
      const constraints = getMediaConstraints(quality);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentQuality = quality;

      if (this.peer) {
        this.peer.addStream(this.localStream);
      }

      logger.info(`Local stream set with ${quality} quality`);
      return this.localStream;
    } catch (error) {
      logger.error('Error getting user media:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  signal(data: SignalData): void {
    if (!this.peer) {
      logger.error('Cannot signal: peer connection not initialized');
      return;
    }

    try {
      this.peer.signal(data);
    } catch (error) {
      logger.error('Error signaling peer:', error);
    }
  }

  sendData(data: unknown): void {
    if (!this.peer || !this.peer.connected) {
      logger.error('Cannot send data: peer not connected');
      return;
    }

    try {
      this.peer.send(JSON.stringify(data));
    } catch (error) {
      logger.error('Error sending data:', error);
    }
  }

  toggleVideo(enabled: boolean): void {
    if (!this.localStream) {
      return;
    }

    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = enabled;
    });
  }

  toggleAudio(enabled: boolean): void {
    if (!this.localStream) {
      return;
    }

    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = enabled;
    });
  }

  async adaptQuality(targetQuality: 'high' | 'medium' | 'low'): Promise<void> {
    if (!this.localStream || this.currentQuality === targetQuality) {
      return;
    }

    try {
      const constraints = getMediaConstraints(targetQuality);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Replace tracks in the peer connection
      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = newStream.getAudioTracks()[0];

      if (this.peer && videoTrack) {
        const videoSender = this.peer._pc.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        }
      }

      if (this.peer && audioTrack) {
        const audioSender = this.peer._pc.getSenders().find(s =>
          s.track && s.track.kind === 'audio'
        );
        if (audioSender) {
          await audioSender.replaceTrack(audioTrack);
        }
      }

      // Stop old tracks
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = newStream;
      this.currentQuality = targetQuality;

      logger.info(`Quality adapted to ${targetQuality}`);
    } catch (error) {
      logger.error('Error adapting quality:', error);
    }
  }

  private startQualityMonitoring(): void {
    if (!this.peer) {
      return;
    }

    this.qualityMonitorInterval = setInterval(async () => {
      try {
        if (!this.peer) {
          return;
        }
        const stats = await this.peer._pc.getStats();
        const quality = this.analyzeConnectionQuality(stats);
        this.eventListeners.connectionQuality?.(quality);

        // Auto-adapt quality based on connection
        if (quality.quality === 'poor' && this.currentQuality !== 'low') {
          await this.adaptQuality('low');
        } else if (quality.quality === 'fair' && this.currentQuality === 'high') {
          await this.adaptQuality('medium');
        } else if (quality.quality === 'excellent' && this.currentQuality !== 'high') {
          await this.adaptQuality('high');
        }
      } catch (error) {
        logger.error('Error monitoring connection quality:', error);
      }
    }, 5000); // Every 5 seconds
  }

  private analyzeConnectionQuality(stats: RTCStatsReport): ConnectionQuality {
    let bandwidth = 0;
    let latency = 0;
    let packetLoss = 0;
    let connectionType: 'direct' | 'relay' = 'direct';

    stats.forEach(stat => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        latency = stat.currentRoundTripTime * 1000; // Convert to ms
        connectionType = stat.localCandidate?.candidateType === 'relay' ? 'relay' : 'direct';
      }

      if (stat.type === 'inbound-rtp' && stat.mediaType === 'video') {
        bandwidth = (stat.bytesReceived * 8) / (stat.timestamp / 1000); // bps
        if (stat.packetsReceived > 0) {
          packetLoss = (stat.packetsLost / stat.packetsReceived) * 100;
        }
      }
    });

    // Determine quality based on metrics
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    if (bandwidth < 500000 || latency > 300 || packetLoss > 5) {
      quality = 'poor';
    } else if (bandwidth < 1000000 || latency > 200 || packetLoss > 2) {
      quality = 'fair';
    } else if (bandwidth < 2000000 || latency > 100 || packetLoss > 1) {
      quality = 'good';
    }

    return {
      bandwidth,
      latency,
      packetLoss,
      connectionType,
      quality,
    };
  }

  on<K extends keyof PeerConnectionEvents>(event: K, listener: PeerConnectionEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  destroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval);
      this.qualityMonitorInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.remoteStream = null;
    this.eventListeners = {};
  }

  get isConnected(): boolean {
    return this.peer?.connected ?? false;
  }

  get localStreamRef(): MediaStream | null {
    return this.localStream;
  }

  get remoteStreamRef(): MediaStream | null {
    return this.remoteStream;
  }
}