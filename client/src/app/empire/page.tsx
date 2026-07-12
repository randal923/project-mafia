import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { EmpirePageContent } from "./EmpirePageContent";

export const generateMetadata = () => getLocalizedMetadata("empire");

export default function EmpirePage() {
  return <EmpirePageContent />;
}
