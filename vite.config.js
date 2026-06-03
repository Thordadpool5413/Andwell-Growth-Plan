import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const allowedHosts = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  ...(process.env.ALLOWED_HOSTS || "").split(",").map((domain) => domain.trim()),
  process.env.VERCEL_URL,
].filter(Boolean);

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 5000),
    strictPort: false,
    allowedHosts,
  },
  define: {
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ""),
  },
});
