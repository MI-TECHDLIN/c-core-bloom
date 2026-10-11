import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, ".");
  const env = loadEnv(mode, envDir, "");

  return {
    envDir,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
        "@/components/admin/AnalyticsDashboard": path.resolve(__dirname, "src/overrides/AnalyticsDashboard.tsx"),
        "@/components/admin/DatabaseDashboard": path.resolve(__dirname, "src/overrides/DatabaseDashboard.tsx"),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      fs: {
        allow: [path.resolve(__dirname, "..")],
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(env),
    },
  };
});
