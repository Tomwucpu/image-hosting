import GalleryClient from "@/components/gallery-client";
import { getSceneryImages, toGalleryImageSummary } from "@/lib/images";

export default async function GalleryPage() {
  const images = (await getSceneryImages()).map(toGalleryImageSummary);

  return <GalleryClient images={images} />;
}
