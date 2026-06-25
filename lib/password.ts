import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/** Supports bcrypt hashes and legacy plaintext rows (e.g. old test seeds). */
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string | null | undefined
): Promise<boolean> {
  if (!storedPassword) return false;
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}
