// Camera Service for Ionic React App
import { Capacitor } from "@capacitor/core";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { EventEmitter } from "eventemitter3";
import { ApiService } from "./api.service";
import {
  ModelType,
  DetectionResult as ApiDetectionResult,
} from "../models/api.model";

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
  platform: string;
  permissionStatus: "unknown" | "granted" | "denied" | "prompt";
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
    platform: Capacitor.getPlatform(),
    permissionStatus: "unknown",
  };

  private captureInterval?: NodeJS.Timeout;
  private currentSettings: CameraSettings = { ...this.DEFAULT_SETTINGS };
  private apiService: ApiService;

  private constructor() {
    super();
    this.apiService = new ApiService();
    // Don't initialize camera automatically - let UI trigger it
    this.updateStatus({ isInitialized: true }); // Service itself is initialized
    console.log(
      `📱 CameraService initialized for platform: ${this.cameraStatus.platform}`
    );
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
   * Check and request camera permissions
   */
  public async requestCameraPermissions(): Promise<void> {
    try {
      console.log(
        `🔒 Requesting camera permissions for platform: ${this.cameraStatus.platform}`
      );

      if (this.cameraStatus.platform === "web") {
        await this.requestWebCameraPermissions();
      } else {
        await this.requestMobileCameraPermissions();
      }
    } catch (error) {
      console.error("Failed to request camera permissions:", error);
      this.updateStatus({
        hasPermission: false,
        permissionStatus: "denied",
        errorMessage: this.getPermissionErrorMessage(error),
      });
      throw error;
    }
  }

  /**
   * Request permissions for web platform
   */
  private async requestWebCameraPermissions(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not supported in this browser");
    }

    // Check if we're on HTTPS or localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      throw new Error("Camera access requires HTTPS connection or localhost");
    }

    try {
      // Request camera access - this will prompt user for permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.currentSettings.width },
          height: { ideal: this.currentSettings.height },
          facingMode: "user",
        },
      });

      // Permission granted - stop the stream (we'll create new ones as needed)
      stream.getTracks().forEach((track) => track.stop());

      this.updateStatus({
        hasPermission: true,
        permissionStatus: "granted",
        errorMessage: undefined,
      });

      console.log("✅ Web camera permission granted");
    } catch (error: any) {
      let permissionStatus: "denied" | "prompt" = "denied";

      if (error.name === "NotAllowedError") {
        permissionStatus = "denied";
      } else if (error.name === "NotFoundError") {
        throw new Error("No camera found on this device");
      } else if (error.name === "NotSupportedError") {
        throw new Error("Camera not supported in this browser");
      } else if (error.name === "NotReadableError") {
        throw new Error("Camera is being used by another application");
      }

      this.updateStatus({
        hasPermission: false,
        permissionStatus,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Request permissions for mobile platform
   */
  private async requestMobileCameraPermissions(): Promise<void> {
    const permission = await Camera.requestPermissions({
      permissions: ["camera"],
    });

    if (permission.camera === "granted") {
      this.updateStatus({
        hasPermission: true,
        permissionStatus: "granted",
        errorMessage: undefined,
      });
      console.log("✅ Mobile camera permission granted");
    } else {
      this.updateStatus({
        hasPermission: false,
        permissionStatus: "denied",
        errorMessage: "Camera permission denied",
      });
      throw new Error("Camera permission denied");
    }
  }

  /**
   * Get user-friendly error message for permission errors
   */
  private getPermissionErrorMessage(error: any): string {
    if (error.name === "NotAllowedError") {
      return "Camera access denied. Please click 'Allow' when prompted.";
    } else if (error.name === "NotFoundError") {
      return "No camera found on this device.";
    } else if (error.name === "NotSupportedError") {
      return "Camera not supported in this browser.";
    } else if (error.name === "NotReadableError") {
      return "Camera is being used by another application.";
    } else if (error.message.includes("HTTPS")) {
      return "Camera requires HTTPS connection. Please use https:// or run on localhost.";
    }
    return error.message || "Camera permission error";
  }

  /**
   * Take a photo using device camera
   */
  private async takePhoto(): Promise<Photo> {
    if (!this.cameraStatus.hasPermission) {
      await this.requestCameraPermissions();
    }

    try {
      console.log(
        `📸 Taking photo on ${this.cameraStatus.platform} platform...`
      );

      let photo: Photo;

      if (this.cameraStatus.platform === "web") {
        photo = await this.takeWebPhoto();
      } else {
        photo = await this.takeMobilePhoto();
      }

      this.updateStatus({
        lastCaptureTime: new Date(),
        captureCount: this.cameraStatus.captureCount + 1,
        errorMessage: undefined,
      });

      console.log(
        `✅ Photo captured successfully (#${
          this.cameraStatus.captureCount + 1
        })`
      );
      return photo;
    } catch (error) {
      console.error("Failed to take photo:", error);
      this.updateStatus({ errorMessage: "Failed to capture photo" });
      throw error;
    }
  }

  /**
   * Take photo using web camera
   */
  private async takeWebPhoto(): Promise<Photo> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create video and canvas elements
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not create canvas context");
        }

        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: this.currentSettings.width },
            height: { ideal: this.currentSettings.height },
            facingMode: "user",
          },
        });

        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;

        video.onloadeddata = () => {
          try {
            // Set canvas dimensions
            canvas.width = video.videoWidth || this.currentSettings.width;
            canvas.height = video.videoHeight || this.currentSettings.height;

            // Capture frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL(
              "image/jpeg",
              this.currentSettings.quality / 100
            );
            const base64 = dataUrl.split(",")[1];

            // Stop stream
            stream.getTracks().forEach((track) => track.stop());

            // Create Photo object
            const photo: Photo = {
              dataUrl,
              base64String: base64,
              format: "jpeg",
              saved: false,
            };

            resolve(photo);
          } catch (error) {
            stream.getTracks().forEach((track) => track.stop());
            reject(error);
          }
        };

        video.onerror = (error) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Video error: " + error));
        };

        // Timeout fallback
        setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Video load timeout"));
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Take photo using mobile camera
   */
  private async takeMobilePhoto(): Promise<Photo> {
    return await Camera.getPhoto(this.currentSettings);
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
    console.log(
      `🎬 Starting continuous capture with ${intervalMs}ms interval...`
    );

    if (this.cameraStatus.isCapturing) {
      console.warn("⚠️ Camera capture is already running");
      return;
    }

    if (!this.cameraStatus.hasPermission) {
      console.log("🔒 Permission needed, requesting...");
      await this.requestCameraPermissions();
    }

    console.log("✅ Starting continuous capture loop");
    this.updateStatus({ isCapturing: true });
    this.emit("statusChanged", this.cameraStatus);

    this.captureInterval = setInterval(async () => {
      try {
        console.log("📸 Capturing frame for analysis...");
        await this.captureAndAnalyze();
      } catch (error) {
        console.error("❌ Error during continuous capture:", error);
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
    console.log("🛑 Continuous capture stopped");
    this.emit("statusChanged", this.cameraStatus);
  }

  /**
   * Capture photo and send to API for drowsiness detection
   */
  private async captureAndAnalyze(): Promise<void> {
    try {
      console.log("📸 Capturing detection frame...");
      const frame = await this.captureDetectionFrame();

      // Prepare detection request
      const detectionRequest = {
        image: frame.imageData,
        model: "yolo" as ModelType, // Default to YOLO for real-time processing
        sessionId: this.generateSessionId(),
      };

      console.log(
        `🔍 Sending frame to API (${this.formatFileSize(frame.fileSize)})...`
      );

      // Send to API for detection
      const detectionResult = await this.apiService.detectDrowsiness(
        detectionRequest
      );

      console.log(
        `✅ Detection completed: ${
          detectionResult.isDrowsy ? "😴 DROWSY" : "😊 ALERT"
        } (${(detectionResult.confidence * 100).toFixed(1)}%)`
      );

      // Emit detection result with frame info
      this.emit("detectionResult", {
        frame: frame,
        result: detectionResult,
        alertLevel: this.getAlertLevel(detectionResult),
      });
    } catch (error) {
      console.error("❌ Failed to analyze frame:", error);
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
      console.log(`📸 Taking single photo for ${modelName} analysis...`);
      const frame = await this.captureDetectionFrame();

      // Prepare detection request
      const detectionRequest = {
        image: frame.imageData,
        model: modelName as ModelType,
        sessionId: this.generateSessionId(),
      };

      console.log(
        `🔍 Analyzing with ${modelName} model (${this.formatFileSize(
          frame.fileSize
        )})...`
      );

      // Send to specific model endpoint
      const detectionResult = await this.apiService.detectDrowsiness(
        detectionRequest
      );

      console.log(
        `✅ Single analysis completed: ${
          detectionResult.isDrowsy ? "😴 DROWSY" : "😊 ALERT"
        } (${(detectionResult.confidence * 100).toFixed(1)}%)`
      );

      this.emit("singleDetection", {
        frame: frame,
        result: detectionResult,
        modelUsed: modelName,
      });

      return detectionResult;
    } catch (error) {
      console.error("❌ Failed to analyze single photo:", error);
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
    if (result.status !== "success" || !result.isDrowsy) {
      return 0; // No alert if not drowsy or failed detection
    }

    // Alert level based on confidence score
    if (result.confidence >= 0.8) return 3; // High alert
    if (result.confidence >= 0.6) return 2; // Medium alert
    if (result.confidence >= 0.4) return 1; // Low alert
    return 0; // No alert
  }

  /**
   * Get current camera settings
   */
  public getCurrentSettings(): CameraSettings {
    return { ...this.currentSettings };
  }

  /**
   * Initialize camera and check/request permissions
   * This should be called by UI components before using the camera
   */
  public async initializeCamera(): Promise<void> {
    console.log(
      `🚀 Initializing camera service for ${this.cameraStatus.platform}...`
    );

    try {
      if (this.cameraStatus.hasPermission) {
        console.log("✅ Camera already has permission");
        return;
      }

      await this.requestCameraPermissions();
      console.log("✅ Camera initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize camera:", error);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Check if camera service is ready to use
   */
  public isReady(): boolean {
    const ready =
      this.cameraStatus.isInitialized && this.cameraStatus.hasPermission;
    console.log(
      `🔍 Camera service ready check: ${
        ready ? "✅ Ready" : "❌ Not ready"
      } (initialized: ${this.cameraStatus.isInitialized}, permission: ${
        this.cameraStatus.hasPermission
      })`
    );
    return ready;
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
