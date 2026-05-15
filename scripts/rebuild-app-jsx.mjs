import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

const repoRoot = process.cwd();
const sourceDir = join(repoRoot, ".github", "source-update");
const outputPath = join(repoRoot, "src", "App.jsx");
const expectedBytes = 184618;

function loadCompressedSource() {
  if (!existsSync(sourceDir)) {
    throw new Error(`Missing source directory: ${sourceDir}`);
  }

  const parts = readdirSync(sourceDir)
    .filter((name) => name.startsWith("app.jsx.gz.b64.part"))
    .sort();

  if (!parts.length) {
    throw new Error("No App.jsx source chunks were found.");
  }

  const base64 = parts
    .map((part) => readFileSync(join(sourceDir, part), "utf8").replaceAll("\n", "").replaceAll("\r", "").trim())
    .join("");

  return { parts, compressed: Buffer.from(base64, "base64") };
}

function recoverSource(compressed) {
  try {
    const source = gunzipSync(compressed);
    if (source.length === expectedBytes) return source;
  } catch (error) {
    console.warn(`Full gzip decode failed: ${error.message}`);
  }

  for (let end = 18; end <= compressed.length; end += 1) {
    try {
      const source = gunzipSync(compressed.subarray(0, end));
      if (source.length === expectedBytes) {
        console.warn(`Recovered App.jsx from first ${end} compressed bytes.`);
        return source;
      }
    } catch {
      // Keep scanning until a valid gzip stream is found.
    }
  }

  throw new Error("Unable to recover a valid App.jsx file from the source chunks.");
}

const { parts, compressed } = loadCompressedSource();
const source = recoverSource(compressed);
const sourceText = source.toString("utf8");

if (!sourceText.includes("export default function AndwellGrowthPlanApp")) {
  throw new Error("Recovered App.jsx is missing the expected React export.");
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sourceText, "utf8");
console.log(`Rebuilt ${outputPath} from ${parts.length} chunk file(s).`);
