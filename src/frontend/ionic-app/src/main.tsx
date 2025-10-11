import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { testApiService } from "./app/test-api";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Run API Service tests after the app loads
setTimeout(() => {
  console.log("🚀 Starting API Service Tests...");
  testApiService();
}, 2000);
