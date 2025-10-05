import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CameraService } from '../service/camera.service';
import { CanvasService } from '../service/canvas.service';
import { InternetService } from '../service/internet.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: false,
})
export class FolderPage implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false })
  videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlayCanvas', { static: false })
  overlayCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewCanvas', { static: false })
  previewCanvas!: ElementRef<HTMLCanvasElement>;

  // Camera state (using signals from service)
  isCameraActive = this.cameraService.isActive;
  currentFacingMode = this.cameraService.currentFacingMode;
  isFrontCamera = this.cameraService.isFrontCamera;

  // Internet status (using signals from service)
  isOnline = this.internetService.online;
  connectionStatus = this.internetService.connectionStatus;

  // Local state
  capturedImage: string | null = null;
  hasMultipleCameras = false;
  showOverlay = true;
  isMirrored = false;
  errorMessage = '';

  constructor(
    private cameraService: CameraService,
    private canvasService: CanvasService,
    private internetService: InternetService
  ) {}

  async ngOnInit() {
    // Check if device has multiple cameras
    this.hasMultipleCameras = await this.cameraService.hasMultipleCameras();
  }

  ngOnDestroy() {
    // Cleanup camera when leaving page
    this.stopCamera();
  }

  /**
   * Start camera
   */
  async startCamera() {
    try {
      this.errorMessage = '';

      // Request permission first
      const permission = await this.cameraService.requestPermission();
      if (!permission.granted) {
        this.errorMessage = permission.message;
        return;
      }

      // Start camera
      await this.cameraService.startCamera(
        this.videoElement.nativeElement,
        this.currentFacingMode()
      );

      // Auto-mirror for front camera
      this.updateMirrorState();

      // Start drawing overlay
      if (this.showOverlay) {
        this.startOverlayLoop();
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to start camera';
      console.error('Camera error:', error);
    }
  }

  /**
   * Stop camera
   */
  stopCamera() {
    this.cameraService.stopCamera();
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera() {
    try {
      this.errorMessage = '';
      await this.cameraService.switchCamera(this.videoElement.nativeElement);

      // Update mirror state for new camera
      this.updateMirrorState();

      // Restart overlay loop
      if (this.showOverlay) {
        this.startOverlayLoop();
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to switch camera';
    }
  }

  /**
   * Toggle mirror effect
   */
  toggleMirror() {
    this.isMirrored = !this.isMirrored;
  }

  /**
   * Update mirror state based on camera facing mode
   */
  private updateMirrorState() {
    // Auto-mirror for front camera (user-facing)
    this.isMirrored = this.currentFacingMode() === 'user';
  }

  /**
   * Capture photo
   */
  capturePhoto() {
    try {
      // Get video element
      const video = this.videoElement.nativeElement;

      // Create canvas for capture
      const canvas = this.canvasService.createCanvas(
        video.videoWidth,
        video.videoHeight
      );

      const ctx = this.canvasService.getContext(canvas);
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Apply mirror transformation if needed
      if (this.isMirrored) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }

      // Draw video frame to canvas
      this.canvasService.drawImage(canvas, video, 0, 0);

      // Restore context if mirrored
      if (this.isMirrored) {
        ctx.restore();
      }

      // Add watermark with timestamp
      const timestamp = new Date().toLocaleString('th-TH');
      this.canvasService.addWatermark(canvas, timestamp, {
        position: 'bottom-right',
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.9)',
      });

      // Get base64 image
      this.capturedImage = this.canvasService.captureFrame(canvas);

      // Show preview
      this.showPreview(this.capturedImage);

      console.log(
        '📸 Photo captured!' + (this.isMirrored ? ' (mirrored)' : '')
      );
    } catch (error) {
      this.errorMessage = 'Failed to capture photo';
      console.error('Capture error:', error);
    }
  }

  /**
   * Show preview on canvas
   */
  private showPreview(dataURL: string) {
    const img = new Image();
    img.onload = () => {
      const canvas = this.previewCanvas.nativeElement;
      canvas.width = img.width;
      canvas.height = img.height;
      this.canvasService.drawImage(canvas, img, 0, 0);
    };
    img.src = dataURL;
  }

  /**
   * Download captured image
   */
  async downloadImage() {
    if (!this.capturedImage) return;

    try {
      const file = await this.canvasService.dataURLToFile(
        this.capturedImage,
        `photo-${Date.now()}.jpg`
      );

      // Create download link
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      console.log('💾 Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
    }
  }

  /**
   * Clear captured image
   */
  clearImage() {
    this.capturedImage = null;
    const canvas = this.previewCanvas.nativeElement;
    if (canvas) {
      this.canvasService.clearCanvas(canvas);
    }
  }

  /**
   * Toggle overlay
   */
  toggleOverlay() {
    this.showOverlay = !this.showOverlay;

    if (this.showOverlay && this.isCameraActive()) {
      this.startOverlayLoop();
    } else {
      this.stopOverlayLoop();
    }
  }

  /**
   * Start overlay drawing loop
   */
  private overlayAnimationId?: number;

  private startOverlayLoop() {
    const drawOverlay = () => {
      if (!this.showOverlay || !this.isCameraActive()) {
        return;
      }

      const video = this.videoElement.nativeElement;
      const canvas = this.overlayCanvas.nativeElement;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw ID card overlay
        this.canvasService.drawIDCardOverlay(canvas, {
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          cardOutlineColor: '#00ff00',
          cardOutlineWidth: 3,
          cornerLength: 50,
          showGuideText: true,
          guideText: 'วางบัตรประชาชนให้อยู่ในกรอบ',
        });
      }

      this.overlayAnimationId = requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
  }

  private stopOverlayLoop() {
    if (this.overlayAnimationId) {
      cancelAnimationFrame(this.overlayAnimationId);
      this.overlayAnimationId = undefined;
    }

    // Clear overlay canvas
    if (this.overlayCanvas) {
      const canvas = this.overlayCanvas.nativeElement;
      this.canvasService.clearCanvas(canvas);
    }
  }

  /**
   * Get available cameras
   */
  async getAvailableCameras() {
    const cameras = await this.cameraService.getAvailableCameras();
    console.log('📹 Available cameras:', cameras);
  }
}
