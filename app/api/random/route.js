import { NextResponse } from "next/server";

import { getRandomSceneryImage, toApiImageSummary } from "@/lib/images";

export async function GET(request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const shouldRedirect = url.searchParams.get("redirect") !== "false";
  const image = await getRandomSceneryImage(type);

  if (!image) {
    return NextResponse.json({ message: "No image found." }, { status: 404 });
  }

  const absoluteUrl = new URL(image.src, request.url).toString();

  if (shouldRedirect) {
    return NextResponse.redirect(absoluteUrl, 307);
  }

  return NextResponse.json(toApiImageSummary(image, absoluteUrl));
}
