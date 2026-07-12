import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { MapPageContent } from "./MapPageContent";

export const generateMetadata = () => getLocalizedMetadata("map");

export default function MapPage() {
  return <MapPageContent />;
}
