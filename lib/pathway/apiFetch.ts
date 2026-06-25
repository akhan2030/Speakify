/** Standard fetch options so NextAuth session cookies are sent. */
export const apiFetchOptions: RequestInit = {
  credentials: "include",
  cache: "no-store",
};

export function apiGet(url: string) {
  return fetch(url, apiFetchOptions);
}

export function apiPost(url: string, body: unknown) {
  return fetch(url, {
    ...apiFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
