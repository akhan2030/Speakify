import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/** Only bcrypt-hashed passwords are accepted. Plaintext rows are rejected. */
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string | null | undefined
): Promise<boolean> {
  if (!storedPassword) return false;
  if (!/^\$2[aby]\$/.test(storedPassword)) return false;
  return bcrypt.compare(plainPassword, storedPassword);
}
