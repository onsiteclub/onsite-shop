/** Canadian postal code utilities — extracted from cart page */

// First letter of FSA → province(s)
export const POSTAL_PROVINCE: Record<string, string[]> = {
  A: ['NL'], B: ['NS'], C: ['PE'], E: ['NB'],
  G: ['QC'], H: ['QC'], J: ['QC'],
  K: ['ON'], L: ['ON'], M: ['ON'], N: ['ON'], P: ['ON'],
  R: ['MB'], S: ['SK'], T: ['AB'], V: ['BC'],
  X: ['NT', 'NU'], Y: ['YT'],
};

/** Detect province from the first letter of a postal code. Returns null if ambiguous (X prefix). */
export function detectProvinceFromPostal(postal: string): string | null {
  const letter = postal.trim().charAt(0).toUpperCase();
  const provinces = POSTAL_PROVINCE[letter];
  if (!provinces) return null;
  // For X prefix (NT/NU), default to NT — same shipping cost
  if (provinces.length > 1) return provinces[0];
  return provinces[0];
}

/** Validate a full Canadian postal code (A1A 1A1 or A1A1A1) */
export function isValidCanadianPostal(postal: string): boolean {
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postal.trim());
}

/** Format a raw postal string to "A1A 1A1" */
export function formatPostalCode(value: string): string {
  let val = value.toUpperCase().replace(/\s/g, '');
  if (val.length > 3) val = val.slice(0, 3) + ' ' + val.slice(3);
  if (val.length > 7) val = val.slice(0, 7);
  return val;
}
