'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MediaConstraintsConfig } from '@/types'

interface MediaPermissionsState {
  video: PermissionState | 'unknown'
  audio: PermissionState | 'unknown'
  isLoading: boolean
  error: string | null
}

interface MediaPermissionsHook extends MediaPermissionsState {
  requestPermissions: (constraints?: MediaConstraintsConfig) => Promise<MediaStream | null>
  checkPermissions: () => Promise<void>
  stream: MediaStream | null
  stopStream: () => void
}

/**
 * Hook for managing media permissions and streams for video calls
 */
export function useMediaPermissions(): MediaPermissionsHook {
  const [state, setState] = useState<MediaPermissionsState>({
    video: 'unknown',
    audio: 'unknown',
    isLoading: false,
    error: null,
  })

  const [stream, setStream] = useState<MediaStream | null>(null)

  // Check current permissions status
  const checkPermissions = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return
    }

    try {
      const [videoPermission, audioPermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ])

      setState(prev => ({
        ...prev,
        video: videoPermission.state,
        audio: audioPermission.state,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check media permissions',
      }))
    }
  }, [])

  // Request media permissions and get stream
  const requestPermissions = useCallback(
    async (constraints?: MediaConstraintsConfig): Promise<MediaStream | null> => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setState(prev => ({ ...prev, error: 'Media devices not supported' }))
        return null
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const defaultConstraints: MediaConstraintsConfig = {
          video: {
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: {
            sampleRate: { ideal: 48000 },
            echoCancellation: true,
            noiseSuppression: true,
          },
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints || defaultConstraints
        )

        setStream(mediaStream)

        // Update permissions after successful request
        await checkPermissions()

        setState(prev => ({ ...prev, isLoading: false }))
        return mediaStream
      } catch (error) {
        let errorMessage = 'Failed to access media devices'

        if (error instanceof Error) {
          switch (error.name) {
            case 'NotAllowedError':
              errorMessage =
                'Camera and microphone access denied. Please enable permissions and try again.'
              break
            case 'NotFoundError':
              errorMessage = 'No camera or microphone found. Please check your devices.'
              break
            case 'NotReadableError':
              errorMessage = 'Camera or microphone is already in use by another application.'
              break
            case 'OverconstrainedError':
              errorMessage = 'Camera or microphone constraints cannot be satisfied.'
              break
            case 'SecurityError':
              errorMessage = 'Media access blocked due to security restrictions.'
              break
          }
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }))

        return null
      }
    },
    [checkPermissions]
  )

  // Stop current media stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
      setStream(null)
    }
  }, [stream])

  // Check permissions on mount
  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return {
    ...state,
    stream,
    requestPermissions,
    checkPermissions,
    stopStream,
  }
}
