declare global {
  namespace Express {
    interface Request {
      /** Firebase uid set by AuthMiddleware after verifying the ID token. */
      uid?: string;
    }
  }
}

export {};
