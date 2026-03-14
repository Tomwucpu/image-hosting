import { readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "public", "image-scenery", "images.json");
const UNKNOWN_SIZE_LABEL = "\u672a\u77e5";
const PENDING_DIMENSION_LABEL = "\u5c3a\u5bf8\u5f85\u8865\u5145";

let imagesPromise;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return UNKNOWN_SIZE_LABEL;
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

function getDimensionLabel(width, height) {
  return width && height ? `${width} \u00d7 ${height}` : PENDING_DIMENSION_LABEL;
}

function toPublicSrc(filename, basePath = "/image-scenery") {
  return `${basePath}/${encodeURIComponent(filename)}`;
}

function createImageRecord(filename, width, height, sizeBytes, previewFilename) {
  const orientation = getOrientation(width, height);

  return {
    filename,
    src: toPublicSrc(filename),
    previewSrc: previewFilename ? toPublicSrc(previewFilename, "/image-scenery/thumbs") : null,
    orientation,
    dimensionLabel: getDimensionLabel(width, height),
    size: formatBytes(sizeBytes),
  };
}

function normalizeImageEntry(entry, index) {
  if (typeof entry === "string") {
    return createImageRecord(entry, null, null, null, null);
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const filename = entry.filename ?? entry.name ?? `image-${index + 1}`;
  const width = Number.isFinite(entry.width) ? entry.width : null;
  const height = Number.isFinite(entry.height) ? entry.height : null;
  const sizeBytes = Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : null;
  const previewFilename = typeof entry.previewFilename === "string" ? entry.previewFilename : null;

  return createImageRecord(filename, width, height, sizeBytes, previewFilename);
}

async function readAndNormalizeImages() {
  const rawManifest = await readFile(manifestPath, "utf8").catch(() => "[]");

  try {
    const manifest = JSON.parse(rawManifest);

    if (!Array.isArray(manifest)) {
      return [];
    }

    return manifest.map(normalizeImageEntry).filter(Boolean);
  } catch {
    return [];
  }
}

async function loadSceneryImages() {
  if (process.env.NODE_ENV === "development") {
    return readAndNormalizeImages();
  }

  if (!imagesPromise) {
    imagesPromise = readAndNormalizeImages();
  }

  return imagesPromise;
}

function matchesType(image, normalizedType) {
  if (!normalizedType) {
    return true;
  }

  return getType(image.orientation) === normalizedType;
}

export function toHomeImageSummary(image) {
  return {
    filename: image.filename,
    src: image.src,
    orientation: image.orientation,
    dimensionLabel: image.dimensionLabel,
  };
}

export function toGalleryImageSummary(image) {
  return {
    filename: image.filename,
    src: image.src,
    previewSrc: image.previewSrc,
    orientation: image.orientation,
    dimensionLabel: image.dimensionLabel,
    size: image.size,
  };
}

export function toApiImageSummary(image) {
  return {
    filename: image.filename,
    url: image.src,
    type: getType(image.orientation),
    orientation: image.orientation,
  };
}

export async function getSceneryImages() {
  return loadSceneryImages();
}

export async function getRandomSceneryImage(type) {
  const images = await loadSceneryImages();
  const normalizedType = type?.toLowerCase();

  let filtered = images;

  if (normalizedType === "pc" || normalizedType === "mobile") {
    filtered = images.filter((image) => matchesType(image, normalizedType));
  }

  if (!filtered.length) {
    filtered = images;
  }

  if (!filtered.length) {
    return null;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}
