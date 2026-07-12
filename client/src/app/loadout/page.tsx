import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { LoadoutPageContent } from "./LoadoutPageContent";

export const generateMetadata = () => getLocalizedMetadata("loadout");

export default function LoadoutPage() {
  return <LoadoutPageContent />;
}
