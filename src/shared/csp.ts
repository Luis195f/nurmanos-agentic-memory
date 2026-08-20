export function apiOriginFromBaseUrl(baseUrl: string | undefined): string {
  if (!baseUrl) return "";
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("VITE_API_BASE_URL must be an absolute HTTP(S) URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("VITE_API_BASE_URL must use HTTP or HTTPS");
  }
  return parsed.origin;
}
