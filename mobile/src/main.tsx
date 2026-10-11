import React from "react";
import { createRoot } from "react-dom/client";
import App from "../../src/App";
import "../../src/index.css";
import "./styles/mobile.css";
import { initMobileShell } from "./native";
import { detectDeviceProfile } from "./perf/deviceProfile";

initMobileShell();
detectDeviceProfile();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
