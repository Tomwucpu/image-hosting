const fs = require("node:fs/promises");
const path = require("node:path");

const imageDir = path.join(process.cwd(), "public", "image-scenery");
const manifestPath = path.join(imageDir, "images.json");
const supportedExtensions = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const jpegSofMarkers = new Set([
  0xc0,
  0xc1,
  0xc2,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
]);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function getOrientation(width, height) {
  if (!width || !height) {
    return null;
  }

  if (height > width) {
    return "portrait";
  }

  if (width > height) {
    return "landscape";
  }

  return "square";
}

function getType(orientation) {
  return orientation === "portrait" ? "mobile" : "pc";
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function getPngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";

  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function getGifDimensions(buffer) {
  const signature = buffer.subarray(0, 6).toString("ascii");

  if (buffer.length < 10 || (signature !== "GIF87a" && signature !== "GIF89a")) {
    return null;
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function getBmpDimensions(buffer) {
  if (buffer.length < 26 || buffer.subarray(0, 2).toString("ascii") !== "BM") {
    return null;
  }

  return {
    width: buffer.readInt32LE(18),
    height: Math.abs(buffer.readInt32LE(22)),
  };
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= buffer.length) {
      return null;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 1 >= buffer.length) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    if (jpegSofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function getWebpDimensions(buffer) {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkOffset = offset + 8;

    if (chunkType === "VP8 " && chunkOffset + 10 <= buffer.length) {
      const startCode = buffer.subarray(chunkOffset + 3, chunkOffset + 6).toString("hex");

      if (startCode === "9d012a") {
        return {
          width: buffer.readUInt16LE(chunkOffset + 6) & 0x3fff,
          height: buffer.readUInt16LE(chunkOffset + 8) & 0x3fff,
        };
      }
    }

    if (chunkType === "VP8L" && chunkOffset + 5 <= buffer.length && buffer[chunkOffset] === 0x2f) {
      const b0 = buffer[chunkOffset + 1];
      const b1 = buffer[chunkOffset + 2];
      const b2 = buffer[chunkOffset + 3];
      const b3 = buffer[chunkOffset + 4];

      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }

    if (chunkType === "VP8X" && chunkOffset + 10 <= buffer.length) {
      return {
        width: 1 + readUInt24LE(buffer, chunkOffset + 4),
        height: 1 + readUInt24LE(buffer, chunkOffset + 7),
      };
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return null;
}

function getImageDimensions(buffer) {
  return (
    getPngDimensions(buffer) ??
    getGifDimensions(buffer) ??
    getBmpDimensions(buffer) ??
    getJpegDimensions(buffer) ??
    getWebpDimensions(buffer)
  );
}

function toPublicSrc(filename) {
  return `/image-scenery/${encodeURIComponent(filename)}`;
}

async function getImageFiles() {
  await fs.mkdir(imageDir, { recursive: true });

  const entries = await fs.readdir(imageDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filename) => filename !== "images.json")
    .filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase()))
    .sort(collator.compare);
}

async function buildManifest() {
  const filenames = await getImageFiles();

  return Promise.all(
    filenames.map(async (filename) => {
      const imagePath = path.join(imageDir, filename);
      const [buffer, fileStats] = await Promise.all([fs.readFile(imagePath), fs.stat(imagePath)]);
      const dimensions = getImageDimensions(buffer) ?? {};
      const width = dimensions.width ?? null;
      const height = dimensions.height ?? null;
      const orientation = getOrientation(width, height);

      return {
        id: filename,
        filename,
        src: toPublicSrc(filename),
        alt: filename,
        width,
        height,
        orientation,
        dimensionLabel: width && height ? `${width} × ${height}` : "尺寸待补充",
        sizeBytes: fileStats.size,
        size: formatBytes(fileStats.size),
        type: getType(orientation),
      };
    }),
  );
}

async function main() {
  const manifest = await buildManifest();

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `Generated ${manifest.length} image metadata entr${manifest.length === 1 ? "y" : "ies"} at ${path.relative(process.cwd(), manifestPath)}`,
  );
}

main().catch((error) => {
  console.error("Failed to generate image manifest.");
  console.error(error);
  process.exitCode = 1;
});
