import { readFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = path.join(process.cwd(), "public", "image-scenery", "images.json");

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

function toPublicSrc(filename) {
  return `/image-scenery/${encodeURIComponent(filename)}`;
}

function normalizeImageEntry(entry, index) {
  if (typeof entry === "string") {
    const orientation = getOrientation(null, null);

    return {
      id: entry,
      filename: entry,
      src: toPublicSrc(entry),
      alt: entry,
      width: null,
      height: null,
      orientation,
      dimensionLabel: "尺寸待补充",
      size: "未知",
      sizeBytes: null,
      type: getType(orientation),
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const filename = entry.filename ?? entry.name ?? `image-${index + 1}`;
  const width = Number.isFinite(entry.width) ? entry.width : null;
  const height = Number.isFinite(entry.height) ? entry.height : null;
  const orientation = entry.orientation ?? getOrientation(width, height);

  return {
    id: entry.id ?? filename,
    filename,
    src: entry.src ?? toPublicSrc(filename),
    alt: entry.alt ?? filename,
    width,
    height,
    orientation,
    dimensionLabel: entry.dimensionLabel ?? (width && height ? `${width} × ${height}` : "尺寸待补充"),
    size: entry.size ?? "未知",
    sizeBytes: Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : null,
    type: entry.type ?? getType(orientation),
  };
}

export async function getSceneryImages() {
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
