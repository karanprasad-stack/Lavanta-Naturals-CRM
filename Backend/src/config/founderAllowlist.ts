/**
 * Server-side allowlist for automated Founder role eligibility.
 * Only normalized, verified emails matching these entries are eligible
 * for automatic Founder role assignment during registration.
 */
export const FOUNDER_EMAIL_ALLOWLIST: readonly string[] = Object.freeze([
  'aditibundela094@gmail.com',
  'badalraj1824@gmail.com'
]);

/**
 * Normalizes email address by trimming surrounding whitespace and converting to lowercase.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Checks whether the given email matches an allowlisted Founder address.
 */
export function isAllowlistedFounderEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return FOUNDER_EMAIL_ALLOWLIST.includes(normalized);
}
