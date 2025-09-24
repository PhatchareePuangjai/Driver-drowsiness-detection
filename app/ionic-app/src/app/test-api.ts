// Test file to validate API Service functionality
import { apiService } from "./services/api.service";
import { ModelType } from "./models/api.model";

/**
 * Test API Service functionality
 */
export async function testApiService() {
  console.log("🧪 Testing API Service...");

  try {
    // Test 1: Health Check
    console.log("📋 Test 1: Health Check");
    const health = await apiService.checkHealth();
    console.log("✅ Health Check Result:", health);

    // Test 2: Get Models
    console.log("📋 Test 2: Get Models");
    const models = await apiService.getModels();
    console.log("✅ Models Result:", models);

    // Test 3: Single Detection
    console.log("📋 Test 3: Single Detection");
    const detectionRequest = {
      image:
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=", // Dummy base64 image
      model: "yolo" as ModelType,
      sessionId: "test_session_001",
    };
    const detection = await apiService.detectDrowsiness(detectionRequest);
    console.log("✅ Detection Result:", detection);

    // Test 4: Network Status
    console.log("📋 Test 4: Network Status");
    const networkStatus = apiService.getNetworkStatus();
    const isConnected = apiService.isBackendConnected();
    console.log("✅ Network Status:", networkStatus);
    console.log("✅ Is Connected:", isConnected);

    // Test 5: Connection Status Subscription
    console.log("📋 Test 5: Connection Status Events");
    const unsubscribe = apiService.onConnectionStatusChange((connected) => {
      console.log("📡 Connection status changed:", connected);
    });

    // Cleanup after 2 seconds
    setTimeout(() => {
      unsubscribe();
      console.log("🧹 Cleaned up connection listener");
    }, 2000);

    console.log("✅ All API Service tests completed successfully!");
  } catch (error) {
    console.error("❌ API Service test failed:", error);
  }
}

// Run tests when this file is imported
if (typeof window !== "undefined") {
  // In browser environment
  window.addEventListener("load", () => {
    testApiService();
  });
}
