/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
// API Service for Backend Communication (React/TypeScript)
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

import {
  ApiResponse,
  DetectionRequest,
  DetectionResult,
  BatchDetectionRequest,
  BatchDetectionResponse,
  HealthCheckResponse,
  ModelsResponse,
  ModelInfo,
  SessionHistoryResponse,
  AppSettings,
  NetworkStatus,
  ModelType,
} from "../models/api.model";
import {
  API_CONFIG,
  ERROR_MESSAGES,
  DEV_CONFIG,
  MODEL_INFO,
} from "../utils/constants";

/**
 * API Service Class for Backend Communication
 * Supports both real backend and mock data for development
 */
export class ApiService {
  private axiosInstance: AxiosInstance;
  private isConnected: boolean = false;
  private networkStatus: NetworkStatus;

  // Event listeners for network status updates
  private connectionListeners: ((status: boolean) => void)[] = [];
  private networkListeners: ((status: NetworkStatus) => void)[] = [];

  constructor() {
    // Initialize Axios instance
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Initialize network status
    this.networkStatus = {
      isOnline: navigator.onLine,
      connectionType: "unknown",
      isBackendReachable: false,
      lastChecked: new Date().toISOString(),
    };

    // Setup request/response interceptors
    this.setupInterceptors();

    // Initialize network monitoring
    this.initializeNetworkMonitoring();

    // Initial health check
    this.checkHealth();
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  /**
   * Health Check - Test backend connectivity
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await this.axiosInstance.get<HealthCheckResponse>(
        API_CONFIG.ENDPOINTS.HEALTH
      );

      this.updateConnectionStatus(true);
      return response.data;
    } catch (error) {
      console.warn("Backend not available, using mock data");
      this.updateConnectionStatus(false);

      // Return mock health response
      return this.getMockHealthResponse();
    }
  }

  /**
   * Get Available Models
   */
  async getModels(): Promise<ModelsResponse> {
    try {
      const response = await this.axiosInstance.get<ModelsResponse>(
        API_CONFIG.ENDPOINTS.MODELS
      );

      return response.data;
    } catch (error) {
      console.warn("Using mock models data");
      return this.getMockModelsResponse();
    }
  }

  /**
   * Single Image Detection
   */
  async detectDrowsiness(request: DetectionRequest): Promise<DetectionResult> {
    try {
      const response = await this.axiosInstance.post<DetectionResult>(
        API_CONFIG.ENDPOINTS.DETECT,
        request
      );

      return response.data;
    } catch (error) {
      console.warn("Using mock detection result");
      return this.getMockDetectionResult(request);
    }
  }

  /**
   * Batch Image Detection
   */
  async detectBatch(
    request: BatchDetectionRequest
  ): Promise<BatchDetectionResponse> {
    try {
      // Longer timeout for batch processing
      const config: AxiosRequestConfig = { timeout: API_CONFIG.TIMEOUT * 2 };

      const response = await this.axiosInstance.post<BatchDetectionResponse>(
        API_CONFIG.ENDPOINTS.DETECT_BATCH,
        request,
        config
      );

      return response.data;
    } catch (error) {
      console.warn("Using mock batch detection result");
      return this.getMockBatchDetectionResult(request);
    }
  }

  /**
   * Start Detection Session (Future implementation)
   */
  async startSession(settings?: any): Promise<any> {
    try {
      const response = await this.axiosInstance.post<any>(
        API_CONFIG.ENDPOINTS.SESSION_START,
        { settings }
      );

      return response.data;
    } catch (error) {
      console.warn("Backend session endpoint not implemented, using mock");
      return this.getMockSessionStart();
    }
  }

  /**
   * End Detection Session (Future implementation)
   */
  async endSession(sessionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post<any>(
        API_CONFIG.ENDPOINTS.SESSION_END,
        { sessionId }
      );

      return response.data;
    } catch (error) {
      console.warn("Backend session endpoint not implemented, using mock");
      return this.getMockSessionEnd(sessionId);
    }
  }

  /**
   * Get Session History (Future implementation)
   */
  async getSessionHistory(): Promise<SessionHistoryResponse> {
    try {
      const response = await this.axiosInstance.get<SessionHistoryResponse>(
        API_CONFIG.ENDPOINTS.SESSION_HISTORY
      );

      return response.data;
    } catch (error) {
      console.warn("Backend session history not implemented, using mock");
      return this.getMockSessionHistory();
    }
  }

  // =============================================================================
  // NETWORK STATUS & EVENTS
  // =============================================================================

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChange(
    callback: (isConnected: boolean) => void
  ): () => void {
    this.connectionListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to network status changes
   */
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.networkListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.networkListeners.indexOf(callback);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection status
   */
  isBackendConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  // =============================================================================
  // MOCK DATA METHODS
  // =============================================================================

  private getMockHealthResponse(): HealthCheckResponse {
    // Simulate some delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: "healthy",
          timestamp: new Date().toISOString(),
          models_loaded: ["yolo", "faster_rcnn", "vgg16"],
        });
      }, DEV_CONFIG.MOCK_API_DELAY);
    }) as any;
  }

  private getMockModelsResponse(): ModelsResponse {
    const models: ModelInfo[] = [
      {
        name: "yolo",
        displayName: MODEL_INFO.yolo.displayName,
        description: MODEL_INFO.yolo.description,
        accuracy: MODEL_INFO.yolo.accuracy,
        speed: MODEL_INFO.yolo.speed as "fast",
        memoryUsage: MODEL_INFO.yolo.memoryUsage as "medium",
        isAvailable: true,
      },
      {
        name: "faster_rcnn",
        displayName: MODEL_INFO.faster_rcnn.displayName,
        description: MODEL_INFO.faster_rcnn.description,
        accuracy: MODEL_INFO.faster_rcnn.accuracy,
        speed: MODEL_INFO.faster_rcnn.speed as "slow",
        memoryUsage: MODEL_INFO.faster_rcnn.memoryUsage as "high",
        isAvailable: true,
      },
      {
        name: "vgg16",
        displayName: MODEL_INFO.vgg16.displayName,
        description: MODEL_INFO.vgg16.description,
        accuracy: MODEL_INFO.vgg16.accuracy,
        speed: MODEL_INFO.vgg16.speed as "medium",
        memoryUsage: MODEL_INFO.vgg16.memoryUsage as "low",
        isAvailable: true,
      },
    ];

    return {
      status: "success",
      models: models,
    };
  }

  private getMockDetectionResult(request: DetectionRequest): DetectionResult {
    // สุ่มผลลัพธ์เพื่อจำลองการทำงานจริง
    const statuses = [
      "safe",
      "drowsy",
      "distracted",
      "safety-violation",
    ] as const;
    const randomIndex = Math.floor(Math.random() * statuses.length);
    const status = statuses[randomIndex];

    // ปรับความมั่นใจตามสถานะ
    let confidence: number;
    let className: string;

    switch (status) {
      case "safe":
        confidence = 0.7 + Math.random() * 0.3; // 0.7-1.0 for safe
        className = "Alert/Focused";
        break;
      case "drowsy":
        confidence = 0.6 + Math.random() * 0.35; // 0.6-0.95 for drowsy
        className = "Drowsy/Sleepy";
        break;
      case "distracted":
        confidence = 0.5 + Math.random() * 0.4; // 0.5-0.9 for distracted
        className = "Distracted/Looking Away";
        break;
      case "safety-violation":
        confidence = 0.8 + Math.random() * 0.2; // 0.8-1.0 for safety violation
        className = "Safety Violation/Phone Use";
        break;
    }

    const mockResult: DetectionResult = {
      id: `mock_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isDrowsy: status,
      confidence: Math.round(confidence * 100) / 100,
      modelUsed: request.model || "yolo",
      inferenceTime: 0.5 + Math.random() * 2, // 0.5-2.5 seconds
      bbox:
        status !== "safe"
          ? {
              x: 100 + Math.floor(Math.random() * 50),
              y: 100 + Math.floor(Math.random() * 50),
              width: 150 + Math.floor(Math.random() * 100),
              height: 150 + Math.floor(Math.random() * 100),
            }
          : undefined,
      alertTriggered:
        (status === "drowsy" || status === "safety-violation") &&
        confidence > 0.7,
      sessionId: request.sessionId,
      status: "success",
      className,
    };

    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockResult), DEV_CONFIG.MOCK_API_DELAY);
    }) as any;
  }

  private getMockBatchDetectionResult(
    request: BatchDetectionRequest
  ): BatchDetectionResponse {
    const statuses = [
      "safe",
      "drowsy",
      "distracted",
      "safety-violation",
    ] as const;

    const results = request.images.map((_, index) => {
      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = statuses[randomIndex];

      let confidence: number;
      let className: string;

      switch (status) {
        case "safe":
          confidence = 0.7 + Math.random() * 0.3;
          className = "Alert/Focused";
          break;
        case "drowsy":
          confidence = 0.6 + Math.random() * 0.35;
          className = "Drowsy/Sleepy";
          break;
        case "distracted":
          confidence = 0.5 + Math.random() * 0.4;
          className = "Distracted/Looking Away";
          break;
        case "safety-violation":
          confidence = 0.8 + Math.random() * 0.2;
          className = "Safety Violation/Phone Use";
          break;
      }

      return {
        index,
        id: `mock_batch_${Date.now()}_${index}`,
        timestamp: new Date().toISOString(),
        isDrowsy: status,
        confidence: Math.round(confidence * 100) / 100,
        modelUsed: request.model || "yolo",
        inferenceTime: 0.3 + Math.random() * 1,
        bbox:
          status !== "safe"
            ? { x: 100, y: 100, width: 200, height: 200 }
            : undefined,
        alertTriggered:
          (status === "drowsy" || status === "safety-violation") &&
          confidence > 0.7,
        sessionId: request.sessionId,
        status: "success" as const,
        className,
      };
    });

    return {
      status: "success",
      results,
      total_inference_time: results.reduce(
        (sum, r) => sum + r.inferenceTime,
        0
      ),
      model_used: request.model || "yolo",
    };
  }

  private getMockSessionStart(): any {
    return {
      status: "success",
      sessionId: `session_${Date.now()}`,
      message: "Detection session started successfully",
    };
  }

  private getMockSessionEnd(sessionId: string): any {
    return {
      status: "success",
      sessionId,
      message: "Detection session ended successfully",
      summary: {
        duration: Math.floor(Math.random() * 3600),
        totalFrames: Math.floor(Math.random() * 1000),
        drowsyFrames: Math.floor(Math.random() * 100),
        alertsTriggered: Math.floor(Math.random() * 10),
      },
    };
  }

  private getMockSessionHistory(): SessionHistoryResponse {
    const mockSessions = Array.from({ length: 5 }, (_, i) => {
      const totalFrames = Math.floor(Math.random() * 1000) + 100;
      const drowsyFrames = Math.floor(Math.random() * 50);
      const distractedFrames = Math.floor(Math.random() * 30);
      const safetyViolationFrames = Math.floor(Math.random() * 10);
      const safeFrames =
        totalFrames - drowsyFrames - distractedFrames - safetyViolationFrames;

      return {
        id: `session_${Date.now() - i * 86400000}`,
        startTime: new Date(Date.now() - i * 86400000).toISOString(),
        endTime: new Date(Date.now() - i * 86400000 + 3600000).toISOString(),
        totalFrames,
        drowsyFrames,
        distractedFrames,
        safetyViolationFrames,
        safeFrames: Math.max(0, safeFrames), // Ensure non-negative
        alertsTriggered: Math.floor(Math.random() * 5),
        averageConfidence: Math.round((0.3 + Math.random() * 0.6) * 100) / 100,
        modelUsed: ["yolo", "faster_rcnn", "vgg16"][
          Math.floor(Math.random() * 3)
        ] as ModelType,
        settings: {
          model: "yolo" as ModelType,
          confidenceThreshold: 0.5,
          frameInterval: 500,
          autoStart: true,
          enablePreprocessing: true,
        },
        duration: 3600,
        isActive: false,
      };
    });

    return {
      status: "success",
      sessions: mockSessions,
      totalSessions: mockSessions.length,
      totalDrowsyDetections: mockSessions.reduce(
        (sum, s) => sum + s.drowsyFrames,
        0
      ),
    };
  }

  // =============================================================================
  // PRIVATE UTILITY METHODS
  // =============================================================================

  /**
   * Setup Axios interceptors for request/response handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (DEV_CONFIG.ENABLE_DEBUG_LOGS) {
          console.log(
            `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
          );
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (DEV_CONFIG.ENABLE_DEBUG_LOGS) {
          console.log(
            `✅ API Response: ${response.status} ${response.config.url}`
          );
        }
        return response;
      },
      async (error: AxiosError) => {
        if (DEV_CONFIG.ENABLE_DEBUG_LOGS) {
          console.error(
            `❌ API Error: ${error.response?.status} ${error.config?.url}`
          );
        }

        // Handle specific error cases
        if (error.code === "ECONNABORTED") {
          console.warn("Request timeout - switching to mock data");
        }

        // Retry logic for network errors
        if (error.response?.status && error.response.status >= 500) {
          // Server errors might be temporary
          this.updateConnectionStatus(false);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.updateNetworkStatus(true);
      this.checkHealth();
    });

    window.addEventListener("offline", () => {
      this.updateNetworkStatus(false);
    });

    // Periodic health checks
    setInterval(() => {
      if (navigator.onLine) {
        this.checkHealth();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(isConnected: boolean): void {
    if (this.isConnected !== isConnected) {
      this.isConnected = isConnected;

      // Notify all listeners
      this.connectionListeners.forEach((callback) => {
        try {
          callback(isConnected);
        } catch (error) {
          console.error("Error in connection status callback:", error);
        }
      });
    }

    this.updateNetworkStatus(isConnected);
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(isBackendReachable: boolean): void {
    this.networkStatus = {
      isOnline: navigator.onLine,
      connectionType: (navigator as any).connection?.effectiveType || "unknown",
      isBackendReachable,
      lastChecked: new Date().toISOString(),
    };

    // Notify all listeners
    this.networkListeners.forEach((callback) => {
      try {
        callback(this.networkStatus);
      } catch (error) {
        console.error("Error in network status callback:", error);
      }
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
