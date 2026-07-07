/** Dev-only quick sign-in on /login — never enabled in production builds. */
export function isDemoLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
}
