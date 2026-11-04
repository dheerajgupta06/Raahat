/**
 * Normalizes Indian phone numbers to digits only.
 * Accepts +91 prefixes and strips common separators.
 */
export function normalizePhone(value) {
  if (typeof value !== 'string') return '';
  let digits = value.replace(/[^\d]/g, '');
  if (digits.startsWith('91') && digits.length > 11) digits = digits.slice(2);
  return digits;
}

/**
 * Valid Indian mobile: 10 digits starting 6-9.
 * Valid landline: STD code with leading 0, 9-13 digits total.
 */
export function isValidIndianPhone(value) {
  if (typeof value !== 'string') return false;
  const digits = normalizePhone(value);
  if (!digits) return false;
  if (/^[6-9]\d{9}$/.test(digits)) return true;
  if (/^0\d{8,12}$/.test(digits)) return true;
  return false;
}

export function formatPhone(value) {
  const digits = normalizePhone(value);
  if (/^[6-9]\d{9}$/.test(digits)) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.startsWith('0') && digits.length >= 10) {
    const stdLength = digits.length - 7;
    return `${digits.slice(0, stdLength)}-${digits.slice(stdLength)}`;
  }
  return value;
}

export function telHref(value) {
  const digits = normalizePhone(value);
  return digits ? `tel:+91${digits.replace(/^0/, '')}` : '';
}

export function whatsappHref(value, text = '') {
  const digits = normalizePhone(value);
  const target = digits.length === 10 ? `91${digits}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${target}${query}`;
}
