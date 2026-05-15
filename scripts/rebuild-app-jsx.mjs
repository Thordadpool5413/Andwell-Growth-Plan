import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync, inflateRawSync } from "node:zlib";

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

function getGzipPayloadStart(buffer) {
  if (buffer[0] !== 0x1f || buffer[1] !== 0x8b || buffer[2] !== 0x08) {
    throw new Error("Source payload is not a gzip stream.");
  }

  const flags = buffer[3];
  let offset = 10;

  if (flags & 0x04) {
    const extraLength = buffer[offset] | (buffer[offset + 1] << 8);
    offset += 2 + extraLength;
  }

  if (flags & 0x08) {
    while (offset < buffer.length && buffer[offset] !== 0) offset += 1;
    offset += 1;
  }

  if (flags & 0x10) {
    while (offset < buffer.length && buffer[offset] !== 0) offset += 1;
    offset += 1;
  }

  if (flags & 0x02) {
    offset += 2;
  }

  return offset;
}

function decompressSourcePayload(compressed) {
  try {
    return gunzipSync(compressed).toString("utf8");
  } catch (error) {
    const payloadStart = getGzipPayloadStart(compressed);
    const payloadEnd = compressed.length - 8;

    if (payloadEnd <= payloadStart) {
      throw error;
    }

    console.warn(`Standard gzip validation failed: ${error.message}`);
    console.warn("Falling back to raw deflate recovery and ignoring the gzip trailer checksum.");

    return inflateRawSync(compressed.subarray(payloadStart, payloadEnd)).toString("utf8");
  }
}

for (const part of parts) {
  const partPath = join(sourceDir, part);
  if (!existsSync(partPath)) {
    throw new Error(`Missing source chunk: ${partPath}`);
  }
}

const base64 = parts.map((part) => readFileSync(join(sourceDir, part), "utf8").trim()).join("");
const compressed = Buffer.from(base64, "base64");
const source = decompressSourcePayload(compressed);

if (!source.includes("export default function AndwellGrowthPlanApp")) {
  throw new Error("Rebuilt App.jsx did not contain the expected React export.");
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source, "utf8");
console.log(`Rebuilt ${outputPath} from ${parts.length} compressed source chunks.`);
