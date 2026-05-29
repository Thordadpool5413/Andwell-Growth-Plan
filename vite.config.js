import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "AI_INTEGRATIONS_"],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
