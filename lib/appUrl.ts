function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (isLocalHost(url.hostname)) return true;
    if (url.hostname.endsWith(".vercel.app")) return true;
    if (url.hostname === "speakify.com" || url.hostname.endsWith(".speakify.com")) {
      return true;
    }
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Prefer the URL the admin is actually using (request headers on Vercel). */
export function resolveAppBaseUrl(request?: Request): string {
  const origin = request?.headers.get("origin")?.trim();
  if (origin && isAllowedOrigin(origin)) {
    return origin.replace(/\/$/, "");
  }

  const forwardedHost = request?.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  const host = request?.headers.get("host")?.trim();
  if (host) {
    const hostname = host.split(":")[0] ?? host;
    const proto = isLocalHost(hostname) ? "http" : "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return getAppBaseUrl();
}

/**
 * Canonical app base URL for emails, invites, and auth redirects.
 * Order: NEXTAUTH_URL → AUTH_URL → VERCEL_URL → localhost (dev only).
 */
export function getAppBaseUrl(): string {
  const fromEnv =
    process.env.NEXTAUTH_URL?.trim() || process.env.AUTH_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return "http://localhost:3000";
}
