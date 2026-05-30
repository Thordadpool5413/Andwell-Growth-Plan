import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const replitDomains = (process.env.REPLIT_DOMAINS || "")
  .split(",")
  .map((domain) => domain.trim())
  .filter(Boolean);

const replitHost = process.env.REPLIT_DEV_DOMAIN || replitDomains[0];

const allowedHosts = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  ".replit.dev",
  ".replit.app",
  ".repl.co",
  process.env.REPLIT_DEV_DOMAIN,
  ...replitDomains,
].filter(Boolean);

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 5000),
    strictPort: false,
    allowedHosts,
    hmr: replitHost
      ? {
          protocol: "wss",
          host: replitHost,
          clientPort: 443,
        }
      : true,
  },
  define: {
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.GOOGLE_MAPS_API_KEY || ""),
  },
});
