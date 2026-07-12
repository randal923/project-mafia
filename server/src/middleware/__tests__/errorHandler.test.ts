import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatApiError } from "../../errors/formatApiError";
import { playerLanguageFromHeader } from "../../../../shared/playerLanguageFromHeader";
import { ErrorHandler, HttpError } from "../errorHandler";

type ResponseCapture = {
  body: unknown;
  statusCode: number;
};

function requestWithLanguage(language?: string): Request {
  return {
    header: (name: string) =>
      name.toLowerCase() === "accept-language" ? language : undefined,
  } as Request;
}

function capturingResponse(capture: ResponseCapture): Response {
  const response = {
    json: (body: unknown) => {
      capture.body = body;
      return response;
    },
    status: (statusCode: number) => {
      capture.statusCode = statusCode;
      return response;
    },
  } as Response;
  return response;
}

const next = (() => undefined) as NextFunction;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorHandler", () => {
  it("honors Accept-Language quality weights", () => {
    expect(playerLanguageFromHeader("en;q=0.2, pt-BR;q=0.9")).toBe("pt-BR");
    expect(playerLanguageFromHeader("pt-BR;q=0, en;q=0.5")).toBe("en");
    expect(playerLanguageFromHeader(undefined, "pt-BR")).toBe("pt-BR");
  });

  it("defaults to an English message while preserving a stable domain code", () => {
    const capture: ResponseCapture = { body: null, statusCode: 0 };
    const error = new HttpError(409, { code: "active_job_exists" });

    new ErrorHandler().handle(
      error,
      requestWithLanguage(),
      capturingResponse(capture),
      next,
    );

    expect(error.message).toBe("Finish your current job first.");
    expect(capture).toEqual({
      body: {
        code: "active_job_exists",
        error: "Finish your current job first.",
      },
      statusCode: 409,
    });
  });

  it.each([
    {
      code: "invalid_auth_token" as const,
      error: "Sua sessão expirou. Entre novamente.",
      statusCode: 401,
    },
    {
      code: "invalid_request" as const,
      error: "Confira as informações enviadas e tente novamente.",
      statusCode: 400,
    },
    {
      code: "active_job_exists" as const,
      error: "Termine seu trabalho atual primeiro.",
      statusCode: 409,
    },
  ])("localizes Portuguese $code responses", ({ code, error, statusCode }) => {
    const capture: ResponseCapture = { body: null, statusCode: 0 };

    new ErrorHandler().handle(
      new HttpError(statusCode, { code }),
      requestWithLanguage("pt-BR,pt;q=0.9,en;q=0.8"),
      capturingResponse(capture),
      next,
    );

    expect(capture).toEqual({
      body: { code, error },
      statusCode,
    });
  });

  it("formats typed error parameters", () => {
    const capture: ResponseCapture = { body: null, statusCode: 0 };

    new ErrorHandler().handle(
      new HttpError(400, {
        code: "required_fields",
        params: { count: 3 },
      }),
      requestWithLanguage("pt"),
      capturingResponse(capture),
      next,
    );

    expect(capture.body).toEqual({
      code: "required_fields",
      error: "Faltam informações obrigatórias na solicitação (3 campos).",
    });
  });

  it("preserves actionable dynamic domain details in both languages", () => {
    expect(
      formatApiError(
        { code: "insufficient_cash", params: { amount: 1250 } },
        "pt-BR",
      ),
    ).toBe(
      `Você precisa de ${new Intl.NumberFormat("pt-BR", {
        currency: "USD",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(1250)} para fazer isso.`,
    );
    expect(
      formatApiError(
        {
          code: "crew_skill_required",
          params: { name: 'Lena "the Ghost" Moretti', required: 18 },
        },
        "pt-BR",
      ),
    ).toBe("Lena Moretti precisa ter habilidade no nível 18 para usar esse item.");
    expect(
      formatApiError(
        { code: "stamina_required", params: { required: 30 } },
        "en",
      ),
    ).toBe("You need 30 stamina to do that.");
  });

  it("returns a localized route-not-found response without route details", () => {
    const capture: ResponseCapture = { body: null, statusCode: 0 };

    new ErrorHandler().notFound(
      requestWithLanguage("pt-BR"),
      capturingResponse(capture),
    );

    expect(capture).toEqual({
      body: {
        code: "route_not_found",
        error: "Essa rota do servidor não existe.",
      },
      statusCode: 404,
    });
  });

  it("never exposes unhandled exception details", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const capture: ResponseCapture = { body: null, statusCode: 0 };

    new ErrorHandler().handle(
      new Error("database password leaked"),
      requestWithLanguage("pt-BR"),
      capturingResponse(capture),
      next,
    );

    expect(capture).toEqual({
      body: {
        code: "internal_error",
        error: "Algo deu errado no servidor. Tente novamente.",
      },
      statusCode: 500,
    });
    expect(JSON.stringify(capture.body)).not.toContain("password");
  });

  it("never exposes internal HttpError details", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const capture: ResponseCapture = { body: null, statusCode: 0 };

    new ErrorHandler().handle(
      new HttpError(500, "sensitive Firestore failure"),
      requestWithLanguage("en"),
      capturingResponse(capture),
      next,
    );

    expect(capture.body).toEqual({
      code: "internal_error",
      error: "Something went wrong on the server. Try again.",
    });
    expect(JSON.stringify(capture.body)).not.toContain("Firestore");
  });

  it("keeps explicit internal details in Error.message only", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const capture: ResponseCapture = { body: null, statusCode: 0 };
    const error = new HttpError(
      500,
      { code: "internal_error" },
      "Mission tree is corrupted at node 01.",
    );

    new ErrorHandler().handle(
      error,
      requestWithLanguage("pt-BR"),
      capturingResponse(capture),
      next,
    );

    expect(error.message).toBe("Mission tree is corrupted at node 01.");
    expect(capture.body).toEqual({
      code: "internal_error",
      error: "Algo deu errado no servidor. Tente novamente.",
    });
  });
});
