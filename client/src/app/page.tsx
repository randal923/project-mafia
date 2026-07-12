import { getLocalizedMetadata } from "../lib/getLocalizedMetadata";
import { HomePageContent } from "./HomePageContent";

export const generateMetadata = () => getLocalizedMetadata("home");

export default function Home() {
  return <HomePageContent />;
}
