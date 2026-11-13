// Legacy codes are opaque and case-sensitive; normalize only short codes.
export function normalizeTrackingCode(value) {
  if (typeof value !== "string") return null;
  const code = value.trim();
  if (/^[A-Za-z0-9_-]{43}$/.test(code)) return code;
  if (!/^[2-9A-HJ-NP-Z]{4}-?[2-9A-HJ-NP-Z]{4}$/i.test(code)) return null;
  const compact = code.replace('-', '').toUpperCase();
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}
