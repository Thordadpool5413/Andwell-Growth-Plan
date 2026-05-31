import { readFileSync, writeFileSync } from "fs";

const serverPath = new URL("../server.js", import.meta.url);
let source = readFileSync(serverPath, "utf8");
let updated = source;

const hostBlock = `const ALLOWED_HOSTS = new Set(
  [
    "localhost",
    "127.0.0.1",
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS || "").split(",").map((d) => d.trim()),
  ].filter(Boolean)
);

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false;
  const bare = hostHeader.split(":")[0].toLowerCase();
  return (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    [...ALLOWED_HOSTS].some((h) => {
      const cleanH = h.split(":")[0].toLowerCase();
      return bare === cleanH;
    })
  );
}`;

const improvedHostBlock = `const REPLIT_HOST_SUFFIXES = [".replit.dev", ".replit.app", ".repl.co"];
const ALLOWED_HOSTS = new Set(
  [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS || "").split(",").map((d) => d.trim()),
  ].filter(Boolean)
);

function normalizeHost(hostHeader) {
  return (hostHeader || "").split(":")[0].toLowerCase();
}

function isAllowedHost(hostHeader) {
  const bare = normalizeHost(hostHeader);
  if (!bare) return false;
  return (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    bare === "0.0.0.0" ||
    REPLIT_HOST_SUFFIXES.some((suffix) => bare.endsWith(suffix)) ||
    [...ALLOWED_HOSTS].some((h) => bare === normalizeHost(h))
  );
}`;

updated = updated.replace(hostBlock, improvedHostBlock);

const originBlock = `function strictOriginCheck(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) {
    res.status(403).json({ error: "Forbidden: browser Origin header required" });
    return;
  }
  let originHost;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    res.status(403).json({ error: "Forbidden: invalid Origin" });
    return;
  }
  const serverHost = (req.headers.host || "").split(":")[0].toLowerCase();
  const allowed =
    originHost === serverHost ||
    originHost === "localhost" ||
    originHost === "127.0.0.1" ||
    [...ALLOWED_HOSTS].some((h) => {
      const cleanH = h.split(":")[0].toLowerCase();
      return originHost === cleanH;
    });
  if (!allowed) {
    res.status(403).json({ error: "Forbidden: cross-origin request denied" });
    return;
  }
  next();
}`;

const improvedOriginBlock = `function strictOriginCheck(req, res, next) {
  const requestHost = req.headers.host;
  if (!isAllowedHost(requestHost)) {
    res.status(403).json({ error: "Forbidden: host not allowed" });
    return;
  }

  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }

  let originHost;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    res.status(403).json({ error: "Forbidden: invalid Origin" });
    return;
  }

  const allowed = normalizeHost(originHost) === normalizeHost(requestHost) || isAllowedHost(originHost);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden: cross-origin request denied" });
    return;
  }
  next();
}`;

updated = updated.replace(originBlock, improvedOriginBlock);

const viteBlock = `if (isDev) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}`;

const improvedViteBlock = `if (isDev) {
  const replitDomains = (process.env.REPLIT_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
  const replitHost = process.env.REPLIT_DEV_DOMAIN || replitDomains[0];

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: replitHost
        ? {
            protocol: "wss",
            host: replitHost,
            clientPort: 443,
          }
        : true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        ".replit.dev",
        ".replit.app",
        ".repl.co",
        process.env.REPLIT_DEV_DOMAIN,
        ...replitDomains,
      ].filter(Boolean),
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}`;

updated = updated.replace(viteBlock, improvedViteBlock);

if (updated !== source) {
  writeFileSync(serverPath, updated);
  console.log("Applied Replit host and origin compatibility fix.");
} else {
  console.log("Replit host and origin compatibility fix already applied.");
}
