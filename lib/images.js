import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const publicDir = path.join(process.cwd(), "public", "image-scenery");
const manifestPath = path.join(publicDir, "images.json");

const imageDetails = {
  "1.jpg": {
    title: "Morning Ridge",
    subtitle: "高反差山脊与清晨光线",
    description: "长线条的山势和逆光很适合做沉浸式背景，画面张力强，也适合当图库封面。",
    width: 7087,
    height: 4724,
  },
  "2.jpg": {
    title: "Layered Valley",
    subtitle: "云海层叠与地貌纹理",
    description: "纹理密度更高，放进图库网格后更容易形成节奏感，适合作为中段视觉焦点。",
    width: 1920,
    height: 1280,
  },
  "3.jpg": {
    title: "Quiet Horizon",
    subtitle: "更安静的旷野色阶",
    description: "色调相对克制，适合放在整组图片之间承担过渡角色，让界面更平衡。",
    width: 6048,
    height: 4024,
  },
};

const fallbackTitles = ["Scenery Frame", "Archive View", "Visual Field", "Still Horizon"];
const layoutCycle = ["feature", "wide", "tall", "wide", "default", "tall"];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export async function getSceneryImages() {
  const rawManifest = await readFile(manifestPath, "utf8");
  const filenames = JSON.parse(rawManifest);

  return Promise.all(
    filenames.map(async (filename, index) => {
      const details = imageDetails[filename] ?? {};
      const imagePath = path.join(publicDir, filename);
      const fileStats = await stat(imagePath).catch(() => null);
      const width = details.width ?? null;
      const height = details.height ?? null;
      const type = width && height ? (width >= height ? "PC" : "Mobile") : "PC";

      return {
        id: `${filename}-${index}`,
        filename,
        src: `/image-scenery/${filename}`,
        alt: `图片 ${index + 1}`,
        title: details.title ?? `${fallbackTitles[index % fallbackTitles.length]} ${String(index + 1).padStart(2, "0")}`,
        subtitle: details.subtitle ?? "已接入当前图片清单",
        description:
          details.description ??
          "当前图片来自 public/image-scenery 目录，已经接入随机展示页与图库预览面板。",
        width,
        height,
        dimensionLabel: width && height ? `${width} × ${height}` : "尺寸待补充",
        size: fileStats ? formatBytes(fileStats.size) : "未知",
        type,
        layout: layoutCycle[index % layoutCycle.length],
      };
    }),
  );
}

export async function getRandomSceneryImage(type) {
  const images = await getSceneryImages();
  const normalizedType = type?.toLowerCase();

  let filtered = images;

  if (normalizedType === "pc") {
    filtered = images.filter((image) => image.type === "PC");
  } else if (normalizedType === "mobile") {
    filtered = images.filter((image) => image.type === "Mobile");
  }

  if (!filtered.length) {
    filtered = images;
  }

  if (!filtered.length) {
    return null;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}
