import "server-only";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Password hashing: scrypt (memory-hard), per-password random salt,
 * parameters stored alongside so they can be raised later without
 * invalidating existing hashes.
 */
const N = 16384, R = 8, P = 1, KEYLEN = 64;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  // Always do the work, even with no stored hash, so timing does not
  // reveal whether an account exists.
  const parts = (stored ?? "").split("$");
  const valid = parts.length === 6 && parts[0] === "scrypt";
  const n = valid ? Number(parts[1]) : N;
  const r = valid ? Number(parts[2]) : R;
  const p = valid ? Number(parts[3]) : P;
  const salt = valid ? Buffer.from(parts[4], "base64url") : randomBytes(16);
  const expected = valid ? Buffer.from(parts[5], "base64url") : randomBytes(KEYLEN);
  const actual = await derive(password, salt, n, r, p);
  return valid && actual.length === expected.length && timingSafeEqual(actual, expected);
}
