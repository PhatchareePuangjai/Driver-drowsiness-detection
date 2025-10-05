/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { DrowsinessStatus, DetectionResult } from "../app/models/api.model";

const CameraTest: React.FC = () => {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("unknown");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null); // Store detection result
  const [isDragOver, setIsDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWeb = Capacitor.getPlatform() === "web";

  // Helper functions for status styling
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

  const getStatusBackgroundColor = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "#e8f5e8";
      case "drowsy":
        return "#fff3cd";
      case "distracted":
        return "#fff3cd";
      case "safety-violation":
        return "#ffeaea";
      default:
        return "#f8f9fa";
    }
  };

  const getStatusBorder = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "2px solid #28a745";
      case "drowsy":
        return "2px solid #ffc107";
      case "distracted":
        return "2px solid #fd7e14";
      case "safety-violation":
        return "2px solid #ef4444";
      default:
        return "1px solid #ccc";
    }
  };

  const getStatusTextColor = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "#155724";
      case "drowsy":
        return "#856404";
      case "distracted":
        return "#c65d00";
      case "safety-violation":
        return "#dc2626";
      default:
        return "inherit";
    }
  };

  const getStatusHeader = (status: DrowsinessStatus) => {
    switch (status) {
      case "safe":
        return "✅ SAFE DETECTED:";
      case "drowsy":
        return "😴 DROWSY DETECTED:";
      case "distracted":
        return "👁️ DISTRACTED DETECTED:";
      case "safety-violation":
        return "⚠️ SAFETY VIOLATION:";
      default:
        return "🎯 Result:";
    }
  };

  const getStatusFontWeight = (status: DrowsinessStatus) => {
    return status === "drowsy" || status === "safety-violation"
      ? "bold"
      : "normal";
  };

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    // eslint-disable-next-line no-console
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
    // Clear previous results
    setDetectionResult(null);
    setError(null);

    if (isWeb) {
      return takeWebPhoto();
    } else {
      return takeMobilePhoto();
    }
  };

  // Handle file upload for web
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous results
    setDetectionResult(null);
    setError(null);

    try {
      setIsLoading(true);
      addDebugInfo(`📁 Processing uploaded file: ${file.name}`);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file (JPG, PNG, etc.)");
      }

      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(
          "File size too large. Please select an image under 10MB."
        );
      }

      // Convert file to base64
      const base64 = await convertFileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;

      setPhotoSrc(dataUrl);
      addDebugInfo(`✅ File uploaded! Size: ${Math.round(file.size / 1024)}KB`);

      // Send to backend for analysis
      await testBackendConnection(base64);
    } catch (err: any) {
      addDebugInfo(`❌ File upload error: ${err.message}`);
      setError(`Upload error: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/xxx;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Upload from gallery (mobile)
  const uploadFromGallery = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDetectionResult(null);
      addDebugInfo("📱 Opening gallery...");

      // Dynamic import to avoid web bundle issues
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos, // Gallery/Photos
        width: 640,
        height: 480,
      });

      if (image.dataUrl) {
        setPhotoSrc(image.dataUrl);
        addDebugInfo("✅ Image selected from gallery!");
        await testBackendConnection(image.dataUrl.split(",")[1]);
      }
    } catch (err: any) {
      addDebugInfo(`❌ Gallery selection error: ${err.message}`);
      setError(`Gallery error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag and drop for web
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      addDebugInfo(`📁 File dropped: ${imageFile.name}`);
      // Process the dropped file directly
      try {
        setIsLoading(true);
        setDetectionResult(null);
        setError(null);

        // Validate file type and size
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Please drop an image file (JPG, PNG, etc.)");
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
          throw new Error(
            "File size too large. Please select an image under 10MB."
          );
        }

        // Convert file to base64
        const base64 = await convertFileToBase64(imageFile);
        const dataUrl = `data:${imageFile.type};base64,${base64}`;

        setPhotoSrc(dataUrl);
        addDebugInfo(
          `✅ File dropped and processed! Size: ${Math.round(
            imageFile.size / 1024
          )}KB`
        );

        // Send to backend for analysis
        await testBackendConnection(base64);
      } catch (err: any) {
        addDebugInfo(`❌ Drop processing error: ${err.message}`);
        setError(`Drop error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please drop an image file (JPG, PNG, etc.)");
    }
  };

  const requestPermissions = async () => {
    // Clear previous results
    setDetectionResult(null);
    setError(null);

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

        // Store the detection result
        setDetectionResult(result);

        // Map status to display message and color
        const statusMessages: { [key: string]: string } = {
          safe: "✅ Safe - Driver is alert",
          drowsy: "😴 Drowsy - Driver showing signs of fatigue",
          distracted: "👁️ Distracted - Driver not focused on road",
          "safety-violation":
            "⚠️ Safety Violation - Immediate attention required",
        };

        const statusMessage =
          statusMessages[result.isDrowsy] ||
          `Unknown status: ${result.isDrowsy}`;

        const alertMsg = `Detection Result:\n${statusMessage}\nConfidence: ${(
          result.confidence * 100
        ).toFixed(1)}%\nModel: ${result.modelUsed || "Mock"}\nClass: ${
          result.className || "N/A"
        }`;

        setError(alertMsg);
        setShowAlert(true);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      addDebugInfo(
        `❌ Backend error: ${err instanceof Error ? err.message : String(err)}`
      );

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
      <IonCardContent
        onDragOver={isWeb ? handleDragOver : undefined}
        onDragLeave={isWeb ? handleDragLeave : undefined}
        onDrop={isWeb ? handleDrop : undefined}
        style={
          isWeb && isDragOver
            ? {
                backgroundColor: "#f0f8ff",
                border: "2px dashed var(--ion-color-primary)",
                borderRadius: "8px",
                transition: "all 0.3s ease",
              }
            : {}
        }
      >
        {/* Drag and Drop Indicator */}
        {isWeb && isDragOver && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "20px",
              borderRadius: "8px",
              border: "2px dashed var(--ion-color-primary)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <IonText color="primary">
              <h3>📁 Drop Image Here</h3>
              <p>Release to upload and analyze</p>
            </IonText>
          </div>
        )}
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
            color={
              error.includes("Detection Result") && detectionResult?.isDrowsy
                ? getStatusColor(detectionResult.isDrowsy)
                : error.includes("Detection Result")
                ? "medium"
                : "danger"
            }
          >
            <p
              style={{
                whiteSpace: "pre-line",
                padding: "12px",
                backgroundColor:
                  error.includes("Detection Result") &&
                  detectionResult?.isDrowsy
                    ? getStatusBackgroundColor(detectionResult.isDrowsy)
                    : error.includes("Detection Result")
                    ? "#f8f9fa"
                    : "#ffe6e6",
                borderRadius: "8px",
                margin: "12px 0",
                border:
                  error.includes("Detection Result") &&
                  detectionResult?.isDrowsy
                    ? getStatusBorder(detectionResult.isDrowsy)
                    : "1px solid #ccc",
              }}
            >
              <strong
                style={{
                  color:
                    error.includes("Detection Result") &&
                    detectionResult?.isDrowsy
                      ? getStatusTextColor(detectionResult.isDrowsy)
                      : "inherit",
                }}
              >
                {error.includes("Detection Result") && detectionResult?.isDrowsy
                  ? getStatusHeader(detectionResult.isDrowsy)
                  : error.includes("Detection Result")
                  ? "🎯 Result:"
                  : "❌ Error:"}
              </strong>
              <br />
              <span
                style={{
                  color:
                    error.includes("Detection Result") &&
                    detectionResult?.isDrowsy
                      ? getStatusTextColor(detectionResult.isDrowsy)
                      : "inherit",
                  fontWeight:
                    error.includes("Detection Result") &&
                    detectionResult?.isDrowsy
                      ? getStatusFontWeight(detectionResult.isDrowsy)
                      : "normal",
                }}
              >
                {error}
              </span>
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
            <p
              style={{
                fontSize: "0.9em",
                color: "var(--ion-color-medium)",
                marginTop: "8px",
              }}
            >
              💡 <strong>Options:</strong> You can either take a photo with
              camera or upload an existing image file{" "}
              {isWeb ? "(JPG, PNG, etc.)" : "from gallery"} for drowsiness
              detection.
            </p>
          </IonText>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <IonButton
            expand="block"
            onClick={requestPermissions}
            color="secondary"
            disabled={isLoading}
            style={{ flex: "1", minWidth: "200px" }}
          >
            {isWeb ? "🎥 REQUEST WEB CAMERA" : "📷 REQUEST MOBILE CAMERA"}
          </IonButton>

          <IonButton
            expand="block"
            onClick={takePicture}
            disabled={isLoading}
            color="primary"
            style={{ flex: "1", minWidth: "200px" }}
          >
            {isLoading ? "⏳ PROCESSING..." : "📸 TAKE PHOTO & DETECT"}
          </IonButton>
        </div>

        {/* Upload Options */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          {isWeb ? (
            <IonButton
              expand="block"
              onClick={triggerFileInput}
              disabled={isLoading}
              color="tertiary"
              style={{ flex: "1", minWidth: "200px" }}
            >
              📁 UPLOAD IMAGE FILE
            </IonButton>
          ) : (
            <IonButton
              expand="block"
              onClick={uploadFromGallery}
              disabled={isLoading}
              color="tertiary"
              style={{ flex: "1", minWidth: "200px" }}
            >
              🖼️ SELECT FROM GALLERY
            </IonButton>
          )}
        </div>

        {/* Drag and Drop Info for Web */}
        {isWeb && (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px dashed #dee2e6",
              textAlign: "center",
            }}
          >
            <IonText color="medium">
              <p style={{ margin: "0", fontSize: "0.9em" }}>
                💡 <strong>Tip:</strong> You can also drag and drop an image
                file anywhere on this card to upload and analyze it!
              </p>
            </IonText>
          </div>
        )}

        {/* Hidden file input for web */}
        {isWeb && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        )}

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
              alt="Image for analysis"
              style={{
                maxWidth: "300px",
                maxHeight: "200px",
                border: "2px solid var(--ion-color-primary)",
                borderRadius: "8px",
              }}
            />
            <IonText color="medium">
              <p style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                📷 Image processed and sent to backend for drowsiness analysis
              </p>
            </IonText>
            <IonButton
              size="small"
              fill="clear"
              color="medium"
              onClick={() => {
                setPhotoSrc(null);
                setDetectionResult(null);
                setError(null);
              }}
              style={{ marginTop: "0.5rem" }}
            >
              🗑️ Clear Image
            </IonButton>
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
