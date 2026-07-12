import type { ReactNode } from "react";
import { getLocalizedMetadata } from "../../lib/getLocalizedMetadata";

export const generateMetadata = () => getLocalizedMetadata("login");

type LoginLayoutProps = {
  children: ReactNode;
};

export default function LoginLayout({ children }: LoginLayoutProps) {
  return children;
}
