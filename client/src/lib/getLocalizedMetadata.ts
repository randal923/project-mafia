import "server-only";

import type { Metadata } from "next";
import en from "../messages/en.json";
import ptBR from "../messages/pt-BR.json";
import { getRequestLanguage } from "./getRequestLanguage";

type MetadataPage = keyof typeof en.metadata.pages;

export async function getLocalizedMetadata(
  page?: MetadataPage,
): Promise<Metadata> {
  const language = await getRequestLanguage();
  const messages = language === "pt-BR" ? ptBR : en;

  return {
    description: messages.metadata.description,
    title: page ? messages.metadata.pages[page] : messages.metadata.title,
  };
}
