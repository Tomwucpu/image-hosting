import HomeClient from "@/components/home-client";
import { getSceneryImages } from "@/lib/images";

export default async function HomePage() {
  const images = await getSceneryImages();

  return <HomeClient images={images} />;
}
