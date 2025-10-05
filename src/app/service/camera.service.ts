import { Injectable, signal, computed } from '@angular/core';

/**
 * Camera Service
 *
 * Handles camera access and management.
 * No abstraction layer needed because:
 * - MediaDevices API is standard
 * - Cross-platform with Capacitor
 * - Simple, focused responsibility
 */
@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private stream: MediaStream | null = null;

  // Signals for reactive state
  private _isActive = signal<boolean>(false);
  private _currentFacingMode = signal<'user' | 'environment'>('environment');

  // Public readonly signals
  readonly isActive = this._isActive.asReadonly();
  readonly currentFacingMode = this._currentFacingMode.asReadonly();
  readonly isFrontCamera = computed(() => this._currentFacingMode() === 'user');

  constructor() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.stopCamera());
  }

  /**
   * Request camera permission
   */
  async requestPermission(): Promise<PermissionStatus> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Try to get permission by requesting camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());

      return { granted: true, message: 'Camera permission granted' };
    } catch (error: any) {
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        return { granted: false, message: 'Camera permission denied' };
      }
      if (error.name === 'NotFoundError') {
        return { granted: false, message: 'No camera found' };
      }
      return { granted: false, message: error.message || 'Unknown error' };
    }
  }

  /**
   * Start camera with specified facing mode
   */
  async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'environment'
  ): Promise<void> {
    try {
      // Check if camera API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Stop existing stream if any
      this.stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      await videoElement.play();

      // Update state
      this._isActive.set(true);
      this._currentFacingMode.set(facingMode);

      console.log('✅ Camera started:', facingMode);
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
      this._isActive.set(false);

      // Provide user-friendly error messages
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        throw new Error(
          'Camera permission denied. Please allow camera access.'
        );
      }
      if (error.name === 'NotFoundError') {
        throw new Error('No camera found on this device.');
      }
      if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.');
      }

      throw error;
    }
  }

  /**
   * Stop camera and release resources
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        console.log('🛑 Camera track stopped');
      });
      this.stream = null;
      this._isActive.set(false);
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(videoElement: HTMLVideoElement): Promise<void> {
    const currentMode = this._currentFacingMode();
    const newMode = currentMode === 'user' ? 'environment' : 'user';

    await this.startCamera(videoElement, newMode);
  }

  /**
   * Check if device has multiple cameras
   */
  async hasMultipleCameras(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      );
      return videoDevices.length > 1;
    } catch (error) {
      console.error('Error checking cameras:', error);
      return false;
    }
  }

  /**
   * Get list of available cameras
   */
  async getAvailableCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substring(0, 5)}`,
        }));
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  }

  /**
   * Capture photo from video element
   */
  capturePhoto(
    videoElement: HTMLVideoElement,
    canvas?: HTMLCanvasElement
  ): string {
    const captureCanvas = canvas || document.createElement('canvas');
    captureCanvas.width = videoElement.videoWidth;
    captureCanvas.height = videoElement.videoHeight;

    const ctx = captureCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(videoElement, 0, 0);
    return captureCanvas.toDataURL('image/jpeg', 0.95);
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }
}

export interface PermissionStatus {
  granted: boolean;
  message: string;
}

export interface CameraDevice {
  id: string;
  label: string;
}
