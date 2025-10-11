/* eslint-disable no-console */
// Camera Service for Ionic React App
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { EventEmitter } from "events";
import { ApiService } from "../app/services/api.service";
import {
  ModelType,
  DetectionResult as ApiDetectionResult,
} from "../app/models/api.model";

export interface CameraSettings {
  quality: number;
  allowEditing: boolean;
  resultType: CameraResultType;
  source: CameraSource;
  width: number;
  height: number;
  saveToGallery: boolean;
}

export interface CameraStatus {
  isInitialized: boolean;
  isCapturing: boolean;
  hasPermission: boolean;
  lastCaptureTime?: Date;
  captureCount: number;
  errorMessage?: string;
  platform?: string;
  permissionStatus?: string;
}

export interface DetectionFrame {
  id: string;
  timestamp: Date;
  imageData: string; // base64 encoded image
  width: number;
  height: number;
  fileSize: number; // in bytes
}

// Use the API DetectionResult type
export type DetectionResult = ApiDetectionResult;

/**
 * Camera Service for Drowsiness Detection
 * Handles camera operations, image capture, and integration with ML API
 */
export class CameraService extends EventEmitter {
  private static instance: CameraService;

  private readonly DEFAULT_SETTINGS: CameraSettings = {
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    width: 640,
    height: 480,
    saveToGallery: false,
  };

  private cameraStatus: CameraStatus = {
    isInitialized: false,
    isCapturing: false,
    hasPermission: false,
    captureCount: 0,
    platform: "web", // Default platform
    permissionStatus: "unknown", // Default permission status
  };

  private captureInterval?: NodeJS.Timeout;
  private currentSettings: CameraSettings = { ...this.DEFAULT_SETTINGS };
  private apiService: ApiService;

  private constructor() {
    super();
    this.apiService = new ApiService();
    this.initializeCamera();
  }

  /**
   * Singleton pattern to ensure only one camera service instance
   */
  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Initialize camera service and check permissions
   */
  private async initializeCamera(): Promise<void> {
    try {
      await this.checkCameraPermissions();
      this.updateStatus({ isInitialized: true });
      this.emit("statusChanged", this.cameraStatus);
    } catch (error) {
      console.error("Failed to initialize camera:", error);
      this.updateStatus({
        isInitialized: false,
        errorMessage: "Failed to initialize camera",
      });
      this.emit("error", error);
    }
  }

  /**
   * Check if camera access is available and has permission
   */
  private async checkCameraPermissions(): Promise<void> {
    if (!this.cameraStatus.hasPermission) {
      await this.requestCameraPermissions();
    }
  }

  /**
   * Request camera permissions from user
   */
  private async requestCameraPermissions(): Promise<void> {
    try {
      const permission = await Camera.requestPermissions({
        permissions: ["camera"],
      });

      if (permission.camera === "granted") {
        this.updateStatus({
          hasPermission: true,
          errorMessage: undefined,
          permissionStatus: "granted",
        });
      } else {
        this.updateStatus({
          hasPermission: false,
          permissionStatus: permission.camera || "denied",
        });
        throw new Error("Camera permission denied");
      }
    } catch (error) {
      console.error("Failed to get camera permission:", error);
      this.updateStatus({
        hasPermission: false,
        errorMessage: "Camera permission required for drowsiness detection",
        permissionStatus: "denied",
      });
      throw error;
    }
  }

  /**
   * Take a photo using device camera
   */
  private async takePhoto(): Promise<Photo> {
    if (!this.cameraStatus.hasPermission) {
      await this.requestCameraPermissions();
    }

    try {
      const photo = await Camera.getPhoto(this.currentSettings);

      if (photo) {
        this.updateStatus({
          lastCaptureTime: new Date(),
          captureCount: this.cameraStatus.captureCount + 1,
          errorMessage: undefined,
        });

        return photo;
      } else {
        throw new Error("Failed to capture photo");
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
      this.updateStatus({ errorMessage: "Failed to capture photo" });
      throw error;
    }
  }

  /**
   * Capture photo and create detection frame
   */
  private async captureDetectionFrame(): Promise<DetectionFrame> {
    const photo = await this.takePhoto();

    if (!photo.base64String) {
      throw new Error("No image data received");
    }

    const imageData = photo.base64String;
    const fileSize = Math.ceil(imageData.length * 0.75); // Approximate base64 to byte size

    const frame: DetectionFrame = {
      id: this.generateFrameId(),
      timestamp: new Date(),
      imageData: imageData,
      width: this.currentSettings.width,
      height: this.currentSettings.height,
      fileSize: fileSize,
    };

    console.log(
      `📸 Photo captured: ${frame.width}x${frame.height}, ${this.formatFileSize(
        frame.fileSize
      )}`
    );
    return frame;
  }

  /**
   * Start continuous camera capture for real-time detection
   * @param intervalMs - Interval between captures in milliseconds (default: 2000ms)
   */
  public async startContinuousCapture(
    intervalMs: number = 2000
  ): Promise<void> {
    if (this.cameraStatus.isCapturing) {
      console.warn("Camera capture is already running");
      return;
    }

    if (!this.cameraStatus.hasPermission) {
      await this.requestCameraPermissions();
    }

    console.log(`Starting continuous capture with ${intervalMs}ms interval`);
    this.updateStatus({ isCapturing: true });

    this.captureInterval = setInterval(async () => {
      try {
        await this.captureAndAnalyze();
      } catch (error) {
        console.error("Error during continuous capture:", error);
        this.emit("captureError", error);
      }
    }, intervalMs);
  }

  /**
   * Stop continuous camera capture
   */
  public stopContinuousCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = undefined;
    }

    this.updateStatus({ isCapturing: false });
    console.log("Continuous capture stopped");
  }

  /**
   * Capture photo and send to API for drowsiness detection
   */
  private async captureAndAnalyze(): Promise<void> {
    try {
      const frame = await this.captureDetectionFrame();

      // Prepare detection request
      const detectionRequest = {
        image: frame.imageData,
        model: "yolo" as ModelType, // Default to YOLO for real-time processing
        sessionId: this.generateSessionId(),
      };

      // Send to API for detection
      const detectionResult = await this.apiService.detectDrowsiness(
        detectionRequest
      );

      // Emit detection result with frame info
      this.emit("detectionResult", {
        frame: frame,
        result: detectionResult,
        alertLevel: this.getAlertLevel(detectionResult),
      });
    } catch (error) {
      console.error("Failed to analyze frame:", error);
      this.emit("analysisError", error);
    }
  }

  /**
   * Process single photo for drowsiness detection
   * @param modelName - Model to use for detection (default: 'yolo')
   */
  public async analyzeSinglePhoto(
    modelName: string = "yolo"
  ): Promise<DetectionResult> {
    try {
      const frame = await this.captureDetectionFrame();

      // Prepare detection request
      const detectionRequest = {
        image: frame.imageData,
        model: modelName as ModelType,
        sessionId: this.generateSessionId(),
      };

      // Send to specific model endpoint
      const detectionResult = await this.apiService.detectDrowsiness(
        detectionRequest
      );

      this.emit("singleDetection", {
        frame: frame,
        result: detectionResult,
        modelUsed: modelName,
      });

      return detectionResult;
    } catch (error) {
      console.error("Failed to analyze single photo:", error);
      throw error;
    }
  }

  /**
   * Get current camera status
   */
  public getStatus(): CameraStatus {
    return { ...this.cameraStatus };
  }

  /**
   * Update camera settings
   * @param newSettings - New camera settings to apply
   */
  public updateSettings(newSettings: Partial<CameraSettings>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
    };

    console.log("Camera settings updated:", this.currentSettings);
    this.emit("settingsChanged", this.currentSettings);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopContinuousCapture();
    this.removeAllListeners();
  }

  /**
   * Update camera status and emit change event
   */
  private updateStatus(updates: Partial<CameraStatus>): void {
    this.cameraStatus = {
      ...this.cameraStatus,
      ...updates,
    };

    this.emit("statusChanged", this.cameraStatus);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cam_session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Generate unique frame ID
   */
  private generateFrameId(): string {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Determine alert level based on detection result
   */
  private getAlertLevel(result: DetectionResult): number {
    if (result.status !== "success") {
      return 0; // No alert if failed detection
    }

    // Determine alert level based on status and confidence
    const shouldAlert =
      result.isDrowsy === "drowsy" ||
      result.isDrowsy === "distracted" ||
      result.isDrowsy === "safety-violation";

    if (!shouldAlert) {
      return 0; // No alert for safe status
    }

    // Higher alert levels for more critical statuses
    if (result.isDrowsy === "safety-violation") {
      // Safety violations always get high alert regardless of confidence
      return result.confidence >= 0.6 ? 3 : 2;
    }

    if (result.isDrowsy === "drowsy") {
      // Drowsiness alerts based on confidence
      if (result.confidence >= 0.8) return 3; // High alert
      if (result.confidence >= 0.6) return 2; // Medium alert
      if (result.confidence >= 0.4) return 1; // Low alert
      return 0;
    }

    if (result.isDrowsy === "distracted") {
      // Distraction alerts (generally lower priority than drowsy)
      if (result.confidence >= 0.9) return 2; // Medium alert only for very high confidence
      if (result.confidence >= 0.7) return 1; // Low alert
      return 0;
    }

    return 0; // Default no alert
  }

  /**
   * Get current camera settings
   */
  public getCurrentSettings(): CameraSettings {
    return { ...this.currentSettings };
  }

  /**
   * Check if camera service is ready
   */
  public isReady(): boolean {
    return this.cameraStatus.isInitialized && this.cameraStatus.hasPermission;
  }

  /**
   * Get capture statistics
   */
  public getStatistics() {
    return {
      captureCount: this.cameraStatus.captureCount,
      isCapturing: this.cameraStatus.isCapturing,
      lastCaptureTime: this.cameraStatus.lastCaptureTime,
      currentSettings: this.getCurrentSettings(),
      status: this.getStatus(),
    };
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();
export default cameraService;
