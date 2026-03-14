import { NextResponse } from "next/server";

import { getRandomSceneryImage, toApiImageSummary } from "@/lib/images";

const DEFAULT_PUBLIC_ORIGIN = "https://image.temperaturetw.top";

function isLocalHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function getPublicOrigin(request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = request.headers.get("host")?.trim();
  const url = new URL(request.url);
  const originHost = forwardedHost || host || url.host;
  const hostname = originHost?.split(":")[0]?.trim() || "";

  if (!originHost || isLocalHost(hostname)) {
    return DEFAULT_PUBLIC_ORIGIN;
  }

  const protocol = forwardedProto || url.protocol.replace(":", "") || "https";

  return `${protocol}://${originHost}`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const shouldRedirect = url.searchParams.get("redirect") !== "false";
  const image = await getRandomSceneryImage(type);

  if (!image) {
    return NextResponse.json({ message: "No image found." }, { status: 404 });
  }

  const absoluteUrl = new URL(image.src, getPublicOrigin(request)).toString();

  if (shouldRedirect) {
    return NextResponse.redirect(absoluteUrl, 307);
  }

  return NextResponse.json(toApiImageSummary(image, absoluteUrl));
}
