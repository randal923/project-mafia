import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { StorePageContent } from "./StorePageContent";

export const generateMetadata = () => getLocalizedMetadata("store");

export default function StorePage() {
  return <StorePageContent />;
}
