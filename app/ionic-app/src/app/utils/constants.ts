// Application Constants

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base URLs from environment
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000",

  // API Endpoints
  ENDPOINTS: {
    HEALTH: import.meta.env.VITE_API_HEALTH || "/api/health",
    MODELS: import.meta.env.VITE_API_MODELS || "/api/models",
    DETECT: import.meta.env.VITE_API_DETECT || "/api/detect",
    DETECT_BATCH: import.meta.env.VITE_API_DETECT_BATCH || "/api/detect/batch",

    // Session endpoints (to be implemented in backend)
    SESSION_START: "/api/session/start",
    SESSION_END: "/api/session/end",
    SESSION_HISTORY: "/api/session/history",

    // Settings endpoints (to be implemented in backend)
    SETTINGS: "/api/settings",
  },

  // Request Configuration
  TIMEOUT: parseInt(import.meta.env.VITE_DETECTION_TIMEOUT) || 30000,
  MAX_RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: 1000, // milliseconds
} as const;

/**
 * Detection Configuration
 */
export const DETECTION_CONFIG = {
  // Models
  DEFAULT_MODEL: (import.meta.env.VITE_DEFAULT_MODEL || "yolo") as
    | "yolo"
    | "faster_rcnn"
    | "vgg16",

  // Image Processing
  MAX_IMAGE_WIDTH: 640,
  MAX_IMAGE_HEIGHT: 480,
  JPEG_QUALITY: 0.8,

  // Frame Processing
  DEFAULT_FPS: 2,
  MIN_FPS: 0.5,
  MAX_FPS: 5,

  // Confidence Thresholds
  CONFIDENCE_THRESHOLDS: {
    LOW: 0.3,
    MEDIUM: 0.5,
    HIGH: 0.7,
  },

  // Detection States
  STATES: {
    IDLE: "idle",
    DETECTING: "detecting",
    PROCESSING: "processing",
    COMPLETED: "completed",
    ERROR: "error",
  },
} as const;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Drowsiness Detector",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === "true",

  // Storage Keys
  STORAGE_KEYS: {
    SETTINGS: "drowsiness_settings",
    SESSION_HISTORY: "session_history",
    CURRENT_SESSION: "current_session",
    PERFORMANCE_METRICS: "performance_metrics",
    USER_PREFERENCES: "user_preferences",
  },

  // Data Retention
  MAX_STORED_SESSIONS: 100,
  MAX_STORED_RESULTS: 1000,
  SESSION_CLEANUP_DAYS: 30,
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  // Themes
  THEMES: {
    LIGHT: "light",
    DARK: "dark",
    AUTO: "auto",
  },

  // Colors (matching theme/variables.scss)
  COLORS: {
    SAFE: "#10B981",
    WARNING: "#F59E0B",
    DANGER: "#EF4444",
    PRIMARY: "#3B82F6",
    NEUTRAL: "#6B7280",
  },

  // Animation Durations
  ANIMATIONS: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },

  // Loading States
  LOADING_MESSAGES: [
    "Initializing camera...",
    "Loading ML models...",
    "Processing image...",
    "Analyzing drowsiness...",
    "Generating results...",
  ],
} as const;

/**
 * Camera Configuration
 */
export const CAMERA_CONFIG = {
  // Camera Settings
  PREFERRED_CAMERA: "front",
  RESOLUTION: {
    WIDTH: 640,
    HEIGHT: 480,
  },

  // Capture Settings
  QUALITY: 80,
  FORMAT: "jpeg",
  ALLOW_EDITING: false,

  // Permissions
  PERMISSION_RETRY_DELAY: 2000,
  MAX_PERMISSION_RETRIES: 3,
} as const;

/**
 * Alert Configuration
 */
export const ALERT_CONFIG = {
  // Alert Types
  TYPES: {
    VISUAL: "visual",
    AUDIO: "audio",
    HAPTIC: "haptic",
  },

  // Alert Levels
  LEVELS: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },

  // Timing
  ESCALATION_DELAY: 5000, // 5 seconds
  AUTO_DISMISS_TIME: 10000, // 10 seconds
  SNOOZE_TIME: 60000, // 1 minute

  // Haptic Patterns
  HAPTIC_PATTERNS: {
    LIGHT: "light",
    MEDIUM: "medium",
    HEAVY: "heavy",
  },

  // Audio
  DEFAULT_SOUND: "alert_1.mp3",
  VOLUME: 0.8,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_ERROR:
    "Network connection error. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timeout. The server is taking too long to respond.",
  SERVER_ERROR: "Server error. Please try again later.",

  // Camera Errors
  CAMERA_PERMISSION_DENIED:
    "Camera permission denied. Please enable camera access in settings.",
  CAMERA_NOT_AVAILABLE: "Camera is not available on this device.",
  CAMERA_BUSY: "Camera is currently in use by another application.",

  // Detection Errors
  INVALID_IMAGE: "Invalid image format. Please try again.",
  MODEL_NOT_AVAILABLE: "Selected ML model is not available.",
  DETECTION_FAILED: "Drowsiness detection failed. Please try again.",

  // General Errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  STORAGE_ERROR: "Unable to save data to local storage.",
  PERMISSION_ERROR: "Required permissions are not granted.",
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  DETECTION_COMPLETED: "Detection completed successfully",
  SESSION_STARTED: "Detection session started",
  SESSION_ENDED: "Detection session ended",
  SETTINGS_SAVED: "Settings saved successfully",
  DATA_EXPORTED: "Data exported successfully",
} as const;

/**
 * Model Information
 */
export const MODEL_INFO = {
  yolo: {
    name: "YOLO",
    displayName: "YOLO v8",
    description: "Fast real-time object detection optimized for mobile devices",
    accuracy: 85,
    speed: "fast",
    memoryUsage: "medium",
    recommendedFor: "Real-time detection",
  },
  faster_rcnn: {
    name: "Faster R-CNN",
    displayName: "Faster R-CNN",
    description: "High-accuracy detection with precise bounding boxes",
    accuracy: 92,
    speed: "slow",
    memoryUsage: "high",
    recommendedFor: "High accuracy requirements",
  },
  vgg16: {
    name: "VGG16",
    displayName: "VGG-16",
    description: "Lightweight classification model for older devices",
    accuracy: 78,
    speed: "medium",
    memoryUsage: "low",
    recommendedFor: "Resource-constrained devices",
  },
} as const;

/**
 * Development Configuration
 */
export const DEV_CONFIG = {
  MOCK_API_DELAY: 1000, // milliseconds
  ENABLE_DEBUG_LOGS: APP_CONFIG.DEV_MODE && APP_CONFIG.ENABLE_LOGGING,
  SHOW_PERFORMANCE_METRICS: APP_CONFIG.DEV_MODE,

  // Mock Data
  MOCK_DETECTION_RESULT: {
    isDrowsy: false,
    confidence: 0.85,
    inferenceTime: 1.2,
    modelUsed: "yolo",
  },
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  // Image
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_FORMATS: ["image/jpeg", "image/png", "image/webp"],

  // Session
  MIN_SESSION_DURATION: 10, // seconds
  MAX_SESSION_DURATION: 8 * 60 * 60, // 8 hours

  // Settings
  CONFIDENCE_RANGE: { min: 0.1, max: 0.95 },
  FPS_RANGE: { min: 0.5, max: 5.0 },
} as const;

/**
 * Export all constants
 */
export default {
  API_CONFIG,
  DETECTION_CONFIG,
  APP_CONFIG,
  UI_CONFIG,
  CAMERA_CONFIG,
  ALERT_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  MODEL_INFO,
  DEV_CONFIG,
  VALIDATION,
};
