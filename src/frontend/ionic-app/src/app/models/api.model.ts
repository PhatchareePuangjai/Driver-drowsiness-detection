// API Response Models for Backend Communication

/**
 * Available ML Models
 */
export type ModelType = "yolo" | "faster_rcnn" | "vgg16";

/**
 * Detection Status
 */
export type DetectionStatus =
  | "idle"
  | "detecting"
  | "processing"
  | "completed"
  | "error";

/**
 * Drowsiness Status
 */
export type DrowsinessStatus =
  | "safe"
  | "drowsy"
  | "distracted"
  | "safety-violation"
  | "unknown";

/**
 * Alert Sensitivity Levels
 */
export type AlertSensitivity = "low" | "medium" | "high";

/**
 * Bounding Box for Detection Results
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Base API Response Structure
 */
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  timestamp?: string;
  data?: T;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  models_loaded: string[];
}

/**
 * Model Information
 */
export interface ModelInfo {
  name: ModelType;
  displayName: string;
  description: string;
  accuracy: number;
  speed: "fast" | "medium" | "slow";
  memoryUsage: "low" | "medium" | "high";
  isAvailable: boolean;
}

/**
 * Available Models Response
 */
export interface ModelsResponse {
  status: string;
  models: ModelInfo[];
}

/**
 * Detection Request Payload
 */
export interface DetectionRequest {
  image: string; // Base64 encoded image
  model?: ModelType;
  sessionId?: string;
  settings?: DetectionSettings;
}

/**
 * Batch Detection Request
 */
export interface BatchDetectionRequest {
  images: string[]; // Array of Base64 encoded images
  model?: ModelType;
  sessionId?: string;
}

/**
 * Detection Result from Backend
 */
export interface DetectionResult {
  id?: string;
  timestamp: string;
  isDrowsy: DrowsinessStatus;
  confidence: number;
  modelUsed: ModelType;
  inferenceTime: number;
  bbox?: BoundingBox;
  alertTriggered?: boolean;
  sessionId?: string;
  status: "success" | "error";
  message?: string;
  className?: string;
}

/**
 * Batch Detection Response
 */
export interface BatchDetectionResponse {
  status: string;
  results: (DetectionResult & { index: number })[];
  total_inference_time: number;
  model_used: ModelType;
}

/**
 * Detection Settings
 */
export interface DetectionSettings {
  model: ModelType;
  confidenceThreshold: number;
  frameInterval: number; // milliseconds between frames
  autoStart: boolean;
  enablePreprocessing: boolean;
}

/**
 * Alert Settings
 */
export interface AlertSettings {
  enableVisual: boolean;
  enableAudio: boolean;
  enableVibration: boolean;
  soundType: string;
  escalation: boolean;
  sensitivity: AlertSensitivity;
  autoSnooze: boolean;
  snoozeTime: number; // seconds
}

/**
 * Privacy Settings
 */
export interface PrivacySettings {
  saveImages: boolean;
  shareData: boolean;
  retentionDays: number;
  anonymizeData: boolean;
  enableAnalytics: boolean;
}

/**
 * UI Settings
 */
export interface UISettings {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: boolean;
  hapticFeedback: boolean;
  keepScreenOn: boolean;
}

/**
 * Complete App Settings
 */
export interface AppSettings {
  detection: DetectionSettings;
  alerts: AlertSettings;
  privacy: PrivacySettings;
  ui: UISettings;
  lastModified: string;
  version: string;
}

/**
 * Detection Session
 */
export interface DetectionSession {
  id: string;
  startTime: string;
  endTime?: string;
  totalFrames: number;
  drowsyFrames: number;
  distractedFrames: number;
  safetyViolationFrames: number;
  safeFrames: number;
  alertsTriggered: number;
  averageConfidence: number;
  modelUsed: ModelType;
  settings: DetectionSettings;
  duration?: number; // seconds
  isActive: boolean;
}

/**
 * Session History Response
 */
export interface SessionHistoryResponse {
  status: string;
  sessions: DetectionSession[];
  totalSessions: number;
  totalDrowsyDetections: number;
}

/**
 * API Error Response
 */
export interface ApiError {
  status: "error";
  message: string;
  code?: number;
  details?: unknown;
  timestamp: string;
}

/**
 * Network Status
 */
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  downloadSpeed?: number;
  isBackendReachable: boolean;
  lastChecked: string;
}

/**
 * App Performance Metrics
 */
export interface PerformanceMetrics {
  averageInferenceTime: number;
  memoryUsage: number;
  batteryLevel: number;
  frameProcessingRate: number; // FPS
  apiResponseTime: number;
  errorRate: number;
}

/**
 * Detection Count by Status
 */
export interface DetectionCounts {
  safe: number;
  drowsy: number;
  distracted: number;
  safetyViolation: number;
}

/**
 * Statistics Data
 */
export interface StatisticsData {
  totalSessions: number;
  totalDetections: number;
  detectionCounts: DetectionCounts;
  averageSessionDuration: number;
  mostUsedModel: ModelType;
  alertsTriggered: number;
  weeklyTrend: DetectionCounts[];
  monthlyTrend: DetectionCounts[];
  peakDrowsinessHours: number[];
  mostCommonIssue: DrowsinessStatus;
}

/**
 * Export Data Format
 */
export interface ExportData {
  sessions: DetectionSession[];
  settings: AppSettings;
  statistics: StatisticsData;
  exportDate: string;
  appVersion: string;
}
