import HomeClient from "@/components/home-client";
import { getSceneryImages, toHomeImageSummary } from "@/lib/images";

export default async function HomePage() {
  const images = (await getSceneryImages()).map(toHomeImageSummary);

  return <HomeClient images={images} />;
}
