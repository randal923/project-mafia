import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";
import { CharacterPageContent } from "./CharacterPageContent";

export const generateMetadata = () => getLocalizedMetadata("character");

export default function CharacterPage() {
  return <CharacterPageContent />;
}
