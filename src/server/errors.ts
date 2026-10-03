import "server-only";

/**
 * Typed application errors. `publicMessage` is the only text that may
 * reach a browser; `detail` is for operator logs and is already free of
 * secrets by construction (callers pass sanitized strings only).
 */
export class AppError extends Error {
  constructor(
    public readonly code:
      | "unauthenticated"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "validation"
      | "suspended"
      | "unavailable"
      | "demo_blocked",
    public readonly publicMessage: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(publicMessage);
    this.name = "AppError";
  }
}

export const unauthenticated = () => new AppError("unauthenticated", "Please sign in.", 401);
export const forbidden = (detail?: string) =>
  new AppError("forbidden", "You do not have access to this.", 403, detail);
/** Not-found and cross-tenant access deliberately look identical. */
export const notFound = (what = "That item") => new AppError("not_found", `${what} was not found.`, 404);
export const conflict = (msg: string) => new AppError("conflict", msg, 409);
export const invalid = (msg: string) => new AppError("validation", msg, 400);
export const suspendedError = () =>
  new AppError("suspended", "This account is paused. Contact AgenticBots to resume service.", 423);
export const unavailable = (msg = "This is temporarily unavailable.") => new AppError("unavailable", msg, 503);
