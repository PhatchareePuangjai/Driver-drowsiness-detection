/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
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
} from "@ionic/react";
import {
  cameraOutline,
  stopCircleOutline,
  settingsOutline,
  eyeOutline,
} from "ionicons/icons";
import { cameraService, CameraStatus } from "../app/services/camera.service";
import { DetectionResult } from "../app/models/api.model";
import "./CameraPage.css";

const CameraPage: React.FC = () => {
  // State Management
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>({
    isInitialized: false,
    isCapturing: false,
    hasPermission: false,
    captureCount: 0,
    platform: "web",
    permissionStatus: "unknown",
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

  // Statistics
  const [sessionStats, setSessionStats] = useState({
    totalDetections: 0,
    drowsyDetections: 0,
    alertsTriggered: 0,
    sessionStartTime: null as Date | null,
  });

  // Initialize camera service and event listeners
  useEffect(() => {
    // Set up event listeners
    const handleStatusChange = (status: CameraStatus) => {
      setCameraStatus(status);
    };

    const handleDetectionResult = (data: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { frame, result, alertLevel: level } = data;
      setLastDetection(result);
      setAlertLevel(level);

      // Update statistics
      setSessionStats((prev) => ({
        ...prev,
        totalDetections: prev.totalDetections + 1,
        drowsyDetections: prev.drowsyDetections + (result.isDrowsy ? 1 : 0),
        alertsTriggered: prev.alertsTriggered + (result.alertTriggered ? 1 : 0),
      }));

      // Show alert if drowsiness detected
      if (result.isDrowsy && result.confidence > 0.7) {
        setAlertMessage(
          `Drowsiness Detected! Confidence: ${(result.confidence * 100).toFixed(
            1
          )}%`
        );
        setShowAlert(true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleError = (error: any) => {
      setAlertMessage("Camera error: " + error.message);
      setShowAlert(true);
    };

    // Add event listeners
    cameraService.on("statusChanged", handleStatusChange);
    cameraService.on("detectionResult", handleDetectionResult);
    cameraService.on("error", handleError);
    cameraService.on("captureError", handleError);
    cameraService.on("analysisError", handleError);

    // Get initial status
    setCameraStatus(cameraService.getStatus());

    // Cleanup function
    return () => {
      cameraService.removeListener("statusChanged", handleStatusChange);
      cameraService.removeListener("detectionResult", handleDetectionResult);
      cameraService.removeListener("error", handleError);
      cameraService.removeListener("captureError", handleError);
      cameraService.removeListener("analysisError", handleError);
    };
  }, []);

  // Start continuous capture
  const startCapture = useCallback(async () => {
    try {
      setIsLoading(true);
      await cameraService.startContinuousCapture(captureInterval);
      setSessionStats((prev) => ({ ...prev, sessionStartTime: new Date() }));
    } catch (error) {
      console.error("Failed to start capture:", error);
      setAlertMessage("Failed to start camera capture");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [captureInterval]);

  // Stop continuous capture
  const stopCapture = useCallback(() => {
    cameraService.stopContinuousCapture();
  }, []);

  // Take single photo for analysis
  const takeSinglePhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await cameraService.analyzeSinglePhoto(selectedModel);
      setLastDetection(result);

      if (result.isDrowsy && result.confidence && result.confidence > 0.5) {
        setAlertMessage(
          `Single Detection: Drowsiness detected with ${(
            result.confidence * 100
          ).toFixed(1)}% confidence`
        );
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Failed to analyze photo:", error);
      setAlertMessage("Failed to analyze photo");
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  // Get status badge color
  const getStatusColor = (status: CameraStatus) => {
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
                  <IonBadge color={getStatusColor(cameraStatus)}>
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
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Control Buttons */}
        <IonCard>
          <IonCardContent>
            <IonGrid>
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
                    Start Monitoring
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
                    Single Check
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Loading Progress */}
        {isLoading && <IonProgressBar type="indeterminate" />}

        {/* Detection Results */}
        {lastDetection && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                Last Detection
                <IonBadge
                  color={lastDetection.isDrowsy ? "danger" : "success"}
                  style={{ marginLeft: "10px" }}
                >
                  {lastDetection.isDrowsy ? "DROWSY" : "ALERT"}
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
                    <IonText color="danger">
                      <p>
                        <strong>Drowsy:</strong> {sessionStats.drowsyDetections}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="6">
                    <IonText color="warning">
                      <p>
                        <strong>Alerts:</strong> {sessionStats.alertsTriggered}
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

export default CameraPage;
