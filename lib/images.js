import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const publicDir = path.join(process.cwd(), "public", "image-scenery");
const manifestPath = path.join(publicDir, "images.json");

const knownDimensions = {
  "1.jpg": { width: 7087, height: 4724 },
  "2.jpg": { width: 1920, height: 1280 },
  "3.jpg": { width: 6048, height: 4024 },
};

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

export async function getSceneryImages() {
  const rawManifest = await readFile(manifestPath, "utf8");
  const filenames = JSON.parse(rawManifest);

  return Promise.all(
    filenames.map(async (filename, index) => {
      const details = knownDimensions[filename] ?? {};
      const imagePath = path.join(publicDir, filename);
      const fileStats = await stat(imagePath).catch(() => null);
      const width = details.width ?? null;
      const height = details.height ?? null;
      const orientation = getOrientation(width, height);

      return {
        id: `${filename}-${index}`,
        filename,
        src: `/image-scenery/${filename}`,
        alt: filename,
        width,
        height,
        orientation,
        dimensionLabel: width && height ? `${width} × ${height}` : "尺寸待补充",
        size: fileStats ? formatBytes(fileStats.size) : "未知",
        type: getType(orientation),
      };
    }),
  );
}

export async function getRandomSceneryImage(type) {
  const images = await getSceneryImages();
  const normalizedType = type?.toLowerCase();

  let filtered = images;

  if (normalizedType === "pc") {
    filtered = images.filter((image) => image.type === "pc");
  } else if (normalizedType === "mobile") {
    filtered = images.filter((image) => image.type === "mobile");
  }

  if (!filtered.length) {
    filtered = images;
  }

  if (!filtered.length) {
    return null;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}
