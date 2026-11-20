export interface SafeBackendEnvironment {
  supabaseHost: string;
}

export function assertSafeBackendEnvironment(
  env: Record<string, string | undefined>
): SafeBackendEnvironment {
  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const allowedHost = env.TEST_ALLOWED_SUPABASE_HOST?.trim().toLowerCase();

  if (!rawUrl || !allowedHost) {
    throw new Error("Supabase URL and TEST_ALLOWED_SUPABASE_HOST are required");
  }

  const url = new URL(rawUrl);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (!local && url.protocol !== "https:") {
    throw new Error("Remote Supabase test URLs must use HTTPS");
  }
  if (url.hostname.toLowerCase() !== allowedHost) {
    throw new Error("Supabase host is not approved for backend tests");
  }

  return { supabaseHost: allowedHost };
}
