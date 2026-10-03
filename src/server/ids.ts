import "server-only";
import { randomUUID, randomBytes, createHash } from "node:crypto";

export const newId = (): string => randomUUID();
export const correlationId = (): string => `cor_${randomBytes(9).toString("base64url")}`;
export const nowIso = (): string => new Date().toISOString();
export const sha256Hex = (s: string): string => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("base64url");
