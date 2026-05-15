import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

const repoRoot = process.cwd();
const sourceDir = join(repoRoot, ".github", "source-update");
const outputPath = join(repoRoot, "src", "App.jsx");
const parts = [
  "app.jsx.gz.b64.part01",
  "app.jsx.gz.b64.part02",
  "app.jsx.gz.b64.part03",
  "app.jsx.gz.b64.part04",
  "app.jsx.gz.b64.part05",
  "app.jsx.gz.b64.part06",
  "app.jsx.gz.b64.part07",
];

for (const part of parts) {
  const partPath = join(sourceDir, part);
  if (!existsSync(partPath)) {
    throw new Error(`Missing source chunk: ${partPath}`);
  }
}

const base64 = parts.map((part) => readFileSync(join(sourceDir, part), "utf8").trim()).join("");
const compressed = Buffer.from(base64, "base64");
const source = gunzipSync(compressed).toString("utf8");

if (!source.includes("export default function AndwellGrowthPlanApp")) {
  throw new Error("Rebuilt App.jsx did not contain the expected React export.");
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source, "utf8");
console.log(`Rebuilt ${outputPath} from ${parts.length} compressed source chunks.`);
