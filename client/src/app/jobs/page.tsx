import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { JobsPageContent } from "./JobsPageContent";

export const generateMetadata = () => getLocalizedMetadata("jobs");

export default function JobsPage() {
  return <JobsPageContent />;
}
