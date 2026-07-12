import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { CrewPageContent } from "./CrewPageContent";

export const generateMetadata = () => getLocalizedMetadata("crew");

export default function CrewPage() {
  return <CrewPageContent />;
}
