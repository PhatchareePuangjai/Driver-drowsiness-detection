import React, { useState, useRef, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
  IonAlert,
} from "@ionic/react";

const CameraTest: React.FC = () => {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("unknown");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isWeb = Capacitor.getPlatform() === "web";

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo((prev) => [...prev.slice(-4), debugMessage]); // Keep last 5 messages
  };

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize web camera for immediate use
  const initializeWebCamera = async () => {
    try {
      addDebugInfo("� Initializing web camera...");
      setError(null);
      setIsLoading(true);

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

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      };

      addDebugInfo(`🎯 Requesting camera access...`);

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      addDebugInfo(
        `✅ Camera access granted! Tracks: ${mediaStream.getTracks().length}`
      );

      streamRef.current = mediaStream;
      setPermissionStatus("granted");

      // Setup video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        addDebugInfo("� Video stream connected");
      }
    } catch (err: any) {
      addDebugInfo(
        `❌ Camera initialization error: ${err.name} - ${err.message}`
      );
      setPermissionStatus("denied");

      let message = err.message;
      if (err.name === "NotAllowedError") {
        message =
          "Camera access denied. Please click 'Allow' when prompted by your browser.";
      } else if (err.name === "NotFoundError") {
        message = "No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        message = "Camera not supported in this browser.";
      } else if (err.name === "NotReadableError") {
        message = "Camera is being used by another application.";
      } else if (
        err.message.includes("HTTPS") ||
        err.message.includes("localhost")
      ) {
        message =
          "Camera requires HTTPS connection. Please use https:// or run on localhost.";
      }

      setError(`Camera error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Take photo using web camera
  const takeWebPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addDebugInfo("� Capturing photo...");

      if (!streamRef.current) {
        await initializeWebCamera();
        if (!streamRef.current) {
          throw new Error("Could not initialize camera");
        }
      }

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Wait for video to be ready
        if (video.readyState < 2) {
          addDebugInfo("⏳ Waiting for video to load...");
          await new Promise((resolve, reject) => {
            video.onloadeddata = resolve;
            video.onerror = reject;
            setTimeout(() => reject(new Error("Video load timeout")), 5000);
          });
        }

        // Set canvas dimensions
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        addDebugInfo(`📐 Canvas size: ${canvas.width}x${canvas.height}`);

        if (context) {
          // Capture frame
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          const base64 = dataUrl.split(",")[1];

          setPhotoSrc(dataUrl);
          addDebugInfo(
            `✅ Photo captured! Size: ${Math.round(base64.length / 1024)}KB`
          );

          await testBackendConnection(base64);
        }
      }
    } catch (err: any) {
      addDebugInfo(`❌ Photo capture error: ${err.message}`);
      setError(`Photo error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile camera using Capacitor (only for non-web platforms)
  const takeMobilePhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addDebugInfo("� Taking mobile photo...");

      // Dynamic import to avoid web bundle issues
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 640,
        height: 480,
      });

      if (image.dataUrl) {
        setPhotoSrc(image.dataUrl);
        addDebugInfo("✅ Mobile photo captured!");
        await testBackendConnection(image.dataUrl.split(",")[1]);
      }
    } catch (err: any) {
      addDebugInfo(`❌ Mobile camera error: ${err.message}`);
      setError(`Mobile camera error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (isWeb) {
      return takeWebPhoto();
    } else {
      return takeMobilePhoto();
    }
  };

  const requestPermissions = async () => {
    if (isWeb) {
      return initializeWebCamera();
    }

    try {
      addDebugInfo("🔒 Requesting mobile permissions...");

      // Dynamic import for mobile platforms
      const { Camera } = await import("@capacitor/camera");

      const permissions = await Camera.requestPermissions({
        permissions: ["camera"],
      });

      if (permissions.camera === "granted") {
        setPermissionStatus("granted");
        addDebugInfo("✅ Mobile permission granted!");
      } else {
        setPermissionStatus("denied");
        setError("Camera permission denied");
      }
    } catch (err: any) {
      addDebugInfo(`❌ Mobile permission error: ${err.message}`);
      setPermissionStatus("denied");
      setError(`Permission error: ${err.message}`);
    }
  };

  const testBackendConnection = async (imageBase64: string) => {
    try {
      addDebugInfo("🌐 Testing backend connection...");

      const backendUrl = "http://127.0.0.1:8000/api/detect";

      const response = await fetch(backendUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          confidence_threshold: 0.5,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addDebugInfo(`✅ Backend response received`);

        const alertMsg = `Detection Result:\n${
          result.isDrowsy ? "😴 DROWSY" : "😊 ALERT"
        }\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nModel: ${
          result.modelUsed || "Mock"
        }\nClass: ${result.className || "N/A"}`;
        setError(alertMsg);
        setShowAlert(true);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      addDebugInfo(`❌ Backend error: ${err.message}`);

      // More specific error messages
      let errorMessage = err.message;
      if (err.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to backend server. Make sure it's running on http://127.0.0.1:8000";
      } else if (err.message.includes("CORS")) {
        errorMessage = "CORS error - check backend CORS configuration";
      } else if (err.message.includes("strict-origin-when-cross-origin")) {
        errorMessage = "CORS policy error - backend needs proper CORS headers";
      }

      setError(`Backend error: ${errorMessage}`);
      setShowAlert(true);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          🧪 Camera Test Component ({isWeb ? "Web Mode" : "Mobile Mode"})
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #e9ecef",
            }}
          >
            <strong>🔍 Debug Log:</strong>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.85em",
                marginTop: "8px",
              }}
            >
              {debugInfo.map((info, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <IonText
            color={error.includes("Detection Result") ? "success" : "danger"}
          >
            <p
              style={{
                whiteSpace: "pre-line",
                padding: "12px",
                backgroundColor: error.includes("Detection Result")
                  ? "#e8f5e8"
                  : "#ffe6e6",
                borderRadius: "8px",
                margin: "12px 0",
              }}
            >
              <strong>
                {error.includes("Detection Result")
                  ? "🎯 Result:"
                  : "❌ Error:"}
              </strong>
              <br />
              {error}
            </p>
          </IonText>
        )}

        <div style={{ marginBottom: "16px" }}>
          <IonText>
            <p>
              <strong>Platform:</strong>{" "}
              {isWeb ? "Web Browser" : "Mobile Device"}
            </p>
            <p>
              <strong>Permission Status:</strong>
              <span
                style={{
                  color:
                    permissionStatus === "granted"
                      ? "green"
                      : permissionStatus === "denied"
                      ? "red"
                      : "orange",
                  fontWeight: "bold",
                  marginLeft: "8px",
                }}
              >
                {permissionStatus}
              </span>
            </p>
            <p>
              <strong>HTTPS:</strong>{" "}
              {window.location.protocol === "https:" ||
              window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1"
                ? "✅ Yes"
                : "❌ No (camera requires HTTPS)"}
            </p>
          </IonText>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
          <IonButton
            expand="block"
            onClick={requestPermissions}
            color="secondary"
            disabled={isLoading}
          >
            {isWeb ? "🎥 REQUEST WEB CAMERA" : "📷 REQUEST MOBILE CAMERA"}
          </IonButton>

          <IonButton
            expand="block"
            onClick={takePicture}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? "⏳ PROCESSING..." : "📸 TAKE PHOTO & DETECT"}
          </IonButton>
        </div>

        {/* Video preview for web (hidden but functional) */}
        {isWeb && (
          <div style={{ display: "none" }}>
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} />
          </div>
        )}

        {/* Show live video preview for web when camera is active */}
        {isWeb && permissionStatus === "granted" && streamRef.current && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div
              style={{
                display: "inline-block",
                border: "2px solid var(--ion-color-primary)",
                borderRadius: "8px",
                overflow: "hidden",
                maxWidth: "300px",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <IonText color="medium">
              <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                📹 Live camera preview - Click "TAKE PHOTO" to capture
              </p>
            </IonText>
          </div>
        )}

        {photoSrc && (
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <IonImg
              src={photoSrc}
              alt="Captured photo"
              style={{
                maxWidth: "300px",
                maxHeight: "200px",
                border: "2px solid var(--ion-color-primary)",
                borderRadius: "8px",
              }}
            />
            <IonText color="medium">
              <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                📷 Photo captured and sent to backend for analysis
              </p>
            </IonText>
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="🧪 Test Result"
          message={error || ""}
          buttons={["OK"]}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default CameraTest;
