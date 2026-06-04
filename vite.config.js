import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 5000),
    strictPort: false,
    allowedHosts: true,
  },
  define: {
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ""),
  },
});
