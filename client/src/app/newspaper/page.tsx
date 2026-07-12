import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { NewspaperPageContent } from "./NewspaperPageContent";

export const generateMetadata = () => getLocalizedMetadata("newspaper");

export default function NewspaperPage() {
  return <NewspaperPageContent />;
}
