import GalleryClient from "@/components/gallery-client";
import { getSceneryImages } from "@/lib/images";

export default async function GalleryPage() {
  const images = await getSceneryImages();

  return <GalleryClient images={images} />;
}
