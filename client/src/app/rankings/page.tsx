import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { RankingsPageContent } from "./RankingsPageContent";

export const generateMetadata = () => getLocalizedMetadata("rankings");

export default function RankingsPage() {
  return <RankingsPageContent />;
}
