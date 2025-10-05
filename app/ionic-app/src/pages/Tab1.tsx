/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonProgressBar,
  IonAlert,
  IonItem,
  IonLabel,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonImg,
} from "@ionic/react";
import {
  cameraOutline,
  stopCircleOutline,
  settingsOutline,
  eyeOutline,
  warningOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";
import {
  cameraService,
  CameraStatus,
  DetectionFrame,
} from "../app/services/camera.service";
import { DetectionResult, DrowsinessStatus } from "../app/models/api.model";
import { Capacitor } from "@capacitor/core";
import "./Tab1.css";

const Tab1: React.FC = () => {
  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State Management
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    isInitialized: false,
    isCapturing: false,
    hasPermission: false,
    captureCount: 0,
    platform: "web", // Default platform
    permissionStatus: "unknown", // Default permission status
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertLevel, setAlertLevel] = useState(0);
  const [lastDetection, setLastDetection] = useState<DetectionResult | null>(
    null
  );
  const [captureInterval, setCaptureInterval] = useState(2000); // 2 seconds default
  const [selectedModel, setSelectedModel] = useState<
    "yolo" | "faster_rcnn" | "vgg16"
  >("yolo");
  const [showSettings, setShowSettings] = useState(false);

  // New states for image display
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
    null
  );
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Statistics
  const [sessionStats, setSessionStats] = useState({
    totalDetections: 0,
    safeDetections: 0,
    drowsyDetections: 0,
    distractedDetections: 0,
    safetyViolationDetections: 0,
    alertsTriggered: 0,
    sessionStartTime: null as Date | null,
  });

  // Check if running on web platform
  const isWeb = Capacitor.getPlatform() === "web";

  // Helper functions for drowsiness status
  const getStatusIcon = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "😊";
      case "drowsy":
        return "😴";
      case "distracted":
        return "👁️";
      case "safety-violation":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const getStatusText = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "Safe";
      case "drowsy":
        return "Drowsy";
      case "distracted":
        return "Distracted";
      case "safety-violation":
        return "Safety Violation";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "success";
      case "drowsy":
        return "warning";
      case "distracted":
        return "warning";
      case "safety-violation":
        return "danger";
      default:
        return "medium";
    }
  };

  const shouldTriggerAlert = (status: DrowsinessStatus) => {
    return status === "drowsy" || status === "safety-violation";
  };

  // Initialize live video preview for web
  const initializeLivePreview = useCallback(async () => {
    if (!isWeb || !cameraStatus.hasPermission) return;

    try {
      console.log("🎥 Initializing live video preview...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowLivePreview(true);
        console.log("✅ Live preview started");
      }
    } catch (error) {
      console.error("❌ Failed to start live preview:", error);
    }
  }, [isWeb, cameraStatus.hasPermission]);

  // Stop live video preview
  const stopLivePreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowLivePreview(false);
    console.log("🛑 Live preview stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLivePreview();
    };
  }, [stopLivePreview]);

  // Initialize camera service and event listeners
  useEffect(() => {
    console.log("🔧 Setting up Tab1 camera integration...");

    // Set up event listeners
    const handleStatusChange = (status: CameraStatus) => {
      console.log("📊 Camera status changed:", status);
      setCameraStatus(status);
    };

    const handleDetectionResult = (data: any) => {
      const { frame, result, alertLevel: level } = data;
      console.log("🎯 Detection result received:", result);
      setLastDetection(result);
      setAlertLevel(level);

      // Store the captured image for display
      if (frame && frame.imageData) {
        const imageDataUrl = `data:image/jpeg;base64,${frame.imageData}`;
        setLastCapturedImage(imageDataUrl);
        console.log("📸 Image stored for display");
      }

      // Update statistics
      setSessionStats((prev) => {
        const newStats = {
          ...prev,
          totalDetections: prev.totalDetections + 1,
          alertsTriggered:
            prev.alertsTriggered + (result.alertTriggered ? 1 : 0),
        };

        // Update counts based on detection status
        switch (result.isDrowsy) {
          case "safe":
            newStats.safeDetections = prev.safeDetections + 1;
            break;
          case "drowsy":
            newStats.drowsyDetections = prev.drowsyDetections + 1;
            break;
          case "distracted":
            newStats.distractedDetections = prev.distractedDetections + 1;
            break;
          case "safety-violation":
            newStats.safetyViolationDetections =
              prev.safetyViolationDetections + 1;
            break;
        }

        return newStats;
      });

      // Show alert if concerning status detected
      if (shouldTriggerAlert(result.isDrowsy) && result.confidence > 0.7) {
        const statusText = getStatusText(result.isDrowsy);
        const statusIcon = getStatusIcon(result.isDrowsy);
        setAlertMessage(
          `${statusIcon} ${statusText} Detected! Confidence: ${(
            result.confidence * 100
          ).toFixed(1)}%`
        );
        setShowAlert(true);
      }
    };

    const handleError = (error: any) => {
      console.error("❌ Camera service error:", error);
      setAlertMessage("Camera error: " + error.message);
      setShowAlert(true);
      setIsLoading(false);
    };

    // Add event listeners
    cameraService.on("statusChanged", handleStatusChange);
    cameraService.on("detectionResult", handleDetectionResult);
    cameraService.on("error", handleError);
    cameraService.on("captureError", handleError);
    cameraService.on("analysisError", handleError);

    // Get initial status
    const initialStatus = cameraService.getStatus();
    console.log("📋 Initial camera status:", initialStatus);
    setCameraStatus(initialStatus);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Tab1 camera integration...");
      cameraService.removeListener("statusChanged", handleStatusChange);
      cameraService.removeListener("detectionResult", handleDetectionResult);
      cameraService.removeListener("error", handleError);
      cameraService.removeListener("captureError", handleError);
      cameraService.removeListener("analysisError", handleError);
    };
  }, []);

  // Initialize camera with proper permission handling
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🚀 Initializing camera from Tab1...");
      await cameraService.initializeCamera();
      console.log("✅ Camera initialized successfully from Tab1");

      // Start live preview for web platform
      if (isWeb) {
        await initializeLivePreview();
      }
    } catch (error) {
      console.error("❌ Failed to initialize camera:", error);
      setAlertMessage(
        "Failed to initialize camera: " + (error as Error).message
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [isWeb, initializeLivePreview]);

  // Start continuous capture
  const startCapture = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🎬 Starting capture from Tab1...");

      // Make sure camera is initialized first
      if (!cameraService.isReady()) {
        console.log("🔧 Camera not ready, initializing first...");
        await cameraService.initializeCamera();
      }

      // Start live preview if not already running
      if (isWeb && !showLivePreview) {
        await initializeLivePreview();
      }

      await cameraService.startContinuousCapture(captureInterval);
      setSessionStats((prev) => ({ ...prev, sessionStartTime: new Date() }));
      console.log("✅ Continuous capture started from Tab1");
    } catch (error) {
      console.error("❌ Failed to start capture:", error);
      setAlertMessage(
        "Failed to start camera capture: " + (error as Error).message
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [captureInterval, isWeb, showLivePreview, initializeLivePreview]);

  // Stop continuous capture
  const stopCapture = useCallback(() => {
    cameraService.stopContinuousCapture();
    // Keep live preview running even after stopping capture
    // User can still see the camera feed
  }, []);

  // Take single photo for analysis
  const takeSinglePhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("📸 Taking single photo from Tab1...");

      // Make sure camera is initialized first
      if (!cameraService.isReady()) {
        console.log("🔧 Camera not ready, initializing first...");
        await cameraService.initializeCamera();
      }

      const result = await cameraService.analyzeSinglePhoto(selectedModel);
      setLastDetection(result);

      // For single photo, we need to get the image data from the service
      // This is a temporary solution - ideally the service should return the image data
      if (isWeb && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context && video.readyState >= 2) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setLastCapturedImage(imageDataUrl);
          console.log("📸 Single photo image stored for display");
        }
      }

      if (
        shouldTriggerAlert(result.isDrowsy) &&
        result.confidence &&
        result.confidence > 0.5
      ) {
        const statusText = getStatusText(result.isDrowsy);
        const statusIcon = getStatusIcon(result.isDrowsy);
        setAlertMessage(
          `Single Detection: ${statusIcon} ${statusText} detected with ${(
            result.confidence * 100
          ).toFixed(1)}% confidence`
        );
        setShowAlert(true);
      }
      console.log("✅ Single photo analysis completed from Tab1");
    } catch (error) {
      console.error("❌ Failed to analyze photo:", error);
      setAlertMessage("Failed to analyze photo: " + (error as Error).message);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, isWeb]);

  // Get camera status badge color
  const getCameraStatusColor = (status: CameraStatus) => {
    if (!status.isInitialized) return "medium";
    if (!status.hasPermission) return "danger";
    if (status.isCapturing) return "success";
    return "primary";
  };

  // Get alert level color
  const getAlertColor = (level: number) => {
    if (level >= 3) return "danger";
    if (level >= 2) return "warning";
    if (level >= 1) return "medium";
    return "success";
  };

  // Format session duration
  const formatSessionDuration = () => {
    if (!sessionStats.sessionStartTime) return "0s";
    const duration = Math.floor(
      (Date.now() - sessionStats.sessionStartTime.getTime()) / 1000
    );
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Drowsiness Detection</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => setShowSettings(!showSettings)}
          >
            <IonIcon icon={settingsOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="camera-page">
        {/* Camera Status Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Camera Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonBadge color={getCameraStatusColor(cameraStatus)}>
                    {cameraStatus.isCapturing
                      ? "CAPTURING"
                      : cameraStatus.isInitialized
                      ? "READY"
                      : "INITIALIZING"}
                  </IonBadge>
                </IonCol>
                <IonCol size="6">
                  <IonText>
                    <p>Captures: {cameraStatus.captureCount}</p>
                  </IonText>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonText color="medium">
                    <small>
                      Platform: {cameraStatus.platform || "unknown"}
                    </small>
                  </IonText>
                </IonCol>
                <IonCol size="6">
                  <IonBadge
                    color={
                      cameraStatus.permissionStatus === "granted"
                        ? "success"
                        : cameraStatus.permissionStatus === "denied"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {cameraStatus.permissionStatus?.toUpperCase() || "UNKNOWN"}
                  </IonBadge>
                </IonCol>
              </IonRow>
              {cameraStatus.lastCaptureTime && (
                <IonRow>
                  <IonCol>
                    <IonText color="medium">
                      <small>
                        Last:{" "}
                        {cameraStatus.lastCaptureTime.toLocaleTimeString()}
                      </small>
                    </IonText>
                  </IonCol>
                </IonRow>
              )}
              {cameraStatus.errorMessage && (
                <IonRow>
                  <IonCol>
                    <IonText color="danger">
                      <small>{cameraStatus.errorMessage}</small>
                    </IonText>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Control Buttons */}
        <IonCard>
          <IonCardContent>
            <IonGrid>
              {/* Camera permission button */}
              {!cameraStatus.hasPermission && (
                <IonRow>
                  <IonCol>
                    <IonButton
                      expand="block"
                      fill="solid"
                      color="secondary"
                      disabled={isLoading}
                      onClick={initializeCamera}
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      {isLoading ? "Requesting..." : "Enable Camera"}
                    </IonButton>
                  </IonCol>
                </IonRow>
              )}

              <IonRow>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    fill="solid"
                    color="primary"
                    disabled={
                      !cameraStatus.hasPermission ||
                      cameraStatus.isCapturing ||
                      isLoading
                    }
                    onClick={startCapture}
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    {isLoading && !cameraStatus.isCapturing
                      ? "Starting..."
                      : "Start Monitoring"}
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    disabled={!cameraStatus.isCapturing}
                    onClick={stopCapture}
                  >
                    <IonIcon icon={stopCircleOutline} slot="start" />
                    Stop
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton
                    expand="block"
                    fill="clear"
                    disabled={!cameraStatus.hasPermission || isLoading}
                    onClick={takeSinglePhoto}
                  >
                    <IonIcon icon={eyeOutline} slot="start" />
                    {isLoading && !cameraStatus.isCapturing
                      ? "Analyzing..."
                      : "Single Check"}
                  </IonButton>
                </IonCol>
              </IonRow>

              {/* Live Preview Toggle (Web only) */}
              {isWeb && cameraStatus.hasPermission && (
                <IonRow>
                  <IonCol>
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="tertiary"
                      onClick={
                        showLivePreview
                          ? stopLivePreview
                          : initializeLivePreview
                      }
                      disabled={isLoading}
                    >
                      <IonIcon icon={eyeOutline} slot="start" />
                      {showLivePreview
                        ? "Hide Live Preview"
                        : "Show Live Preview"}
                    </IonButton>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Loading Progress */}
        {isLoading && <IonProgressBar type="indeterminate" />}

        {/* Live Camera Preview for Web */}
        {isWeb && showLivePreview && streamRef.current && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>📹 Live Camera Preview</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-block",
                    border: "2px solid var(--ion-color-primary)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    maxWidth: "100%",
                    width: "320px",
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
                <IonText color="medium">
                  <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                    🔴 Live camera feed - This is what the system sees
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Last Captured Image */}
        {lastCapturedImage && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                📸 Last Captured Frame
                <IonButton
                  size="small"
                  fill="clear"
                  color="medium"
                  onClick={() => setLastCapturedImage(null)}
                  style={{ float: "right" }}
                >
                  Clear
                </IonButton>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ textAlign: "center" }}>
                <IonImg
                  src={lastCapturedImage}
                  alt="Last captured frame"
                  style={{
                    maxWidth: "320px",
                    maxHeight: "240px",
                    border: "2px solid var(--ion-color-primary)",
                    borderRadius: "8px",
                    margin: "0 auto",
                  }}
                />
                <IonText color="medium">
                  <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                    📷 This frame was analyzed by the AI model
                    {lastDetection && (
                      <span style={{ display: "block", marginTop: "0.25rem" }}>
                        Result: {getStatusIcon(lastDetection.isDrowsy)}{" "}
                        {getStatusText(lastDetection.isDrowsy)} (
                        {(lastDetection.confidence * 100).toFixed(1)}%
                        confidence)
                      </span>
                    )}
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Detection Results */}
        {lastDetection && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                Last Detection
                <IonBadge
                  color={getStatusColor(lastDetection.isDrowsy)}
                  style={{ marginLeft: "10px" }}
                >
                  {getStatusIcon(lastDetection.isDrowsy)}{" "}
                  {getStatusText(lastDetection.isDrowsy).toUpperCase()}
                </IonBadge>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonText>
                      <p>
                        <strong>Confidence:</strong>{" "}
                        {(lastDetection.confidence * 100).toFixed(1)}%
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonText>
                      <p>
                        <strong>Model:</strong> {lastDetection.modelUsed}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonText>
                      <p>
                        <strong>Time:</strong>{" "}
                        {lastDetection.inferenceTime.toFixed(2)}s
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonBadge color={getAlertColor(alertLevel)}>
                      Alert Level: {alertLevel}
                    </IonBadge>
                  </IonCol>
                </IonRow>
                {lastDetection.bbox && (
                  <IonRow>
                    <IonCol>
                      <IonText color="medium">
                        <small>
                          Detection area: {lastDetection.bbox.width}×
                          {lastDetection.bbox.height}
                        </small>
                      </IonText>
                    </IonCol>
                  </IonRow>
                )}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {/* Session Statistics */}
        {sessionStats.sessionStartTime && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Session Stats</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonText>
                      <p>
                        <strong>Duration:</strong> {formatSessionDuration()}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonText>
                      <p>
                        <strong>Total:</strong> {sessionStats.totalDetections}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonText color="success">
                      <p>
                        <strong>😊 Safe:</strong> {sessionStats.safeDetections}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonText color="warning">
                      <p>
                        <strong>😴 Drowsy:</strong>{" "}
                        {sessionStats.drowsyDetections}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <IonText color="warning">
                      <p>
                        <strong>👁️ Distracted:</strong>{" "}
                        {sessionStats.distractedDetections}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonText color="danger">
                      <p>
                        <strong>⚠️ Violations:</strong>{" "}
                        {sessionStats.safetyViolationDetections}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonText color="medium">
                      <p style={{ textAlign: "center" }}>
                        <strong>🚨 Alerts Triggered:</strong>{" "}
                        {sessionStats.alertsTriggered}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Detection Settings</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Capture Interval</IonLabel>
                <IonRange
                  min={1000}
                  max={10000}
                  step={500}
                  value={captureInterval}
                  onIonChange={(e) =>
                    setCaptureInterval(e.detail.value as number)
                  }
                  snaps={true}
                />
                <IonLabel slot="end">{captureInterval / 1000}s</IonLabel>
              </IonItem>

              <IonItem>
                <IonLabel>Detection Model</IonLabel>
                <IonSelect
                  value={selectedModel}
                  onIonChange={(e) => setSelectedModel(e.detail.value)}
                >
                  <IonSelectOption value="yolo">YOLO (Fast)</IonSelectOption>
                  <IonSelectOption value="faster_rcnn">
                    Faster R-CNN (Accurate)
                  </IonSelectOption>
                  <IonSelectOption value="vgg16">
                    VGG16 (Lightweight)
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {/* Alert Dialog */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Detection Alert"
          message={alertMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
