const LEGACY_INSECURE_COOKIE = "next-auth.session-token";
const LEGACY_SECURE_COOKIE = "__Secure-next-auth.session-token";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? `${LEGACY_SECURE_COOKIE}.v2`
    : `${LEGACY_INSECURE_COOKIE}.v2`;

export const AUTH_COOKIE_CANDIDATES = [
  LEGACY_INSECURE_COOKIE,
  LEGACY_SECURE_COOKIE,
  `${LEGACY_INSECURE_COOKIE}.v2`,
  `${LEGACY_SECURE_COOKIE}.v2`,
];

export const OVERSIZED_COOKIE_THRESHOLD = 2000;

export function isSecureCookie(name: string) {
  return name.startsWith("__Secure-");
}
