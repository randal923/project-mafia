import { NextFunction, Request, Response } from "express";
import { FirebaseService } from "../services/FirebaseService";
import { HttpError } from "./errorHandler";

export class AuthMiddleware {
  constructor(private readonly firebase: FirebaseService) {}

  authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new HttpError(401, "Missing bearer token");
    }

    try {
      const decoded = await this.firebase.auth.verifyIdToken(token);
      req.uid = decoded.uid;
    } catch {
      throw new HttpError(401, "Invalid or expired token");
    }

    next();
  };
}
