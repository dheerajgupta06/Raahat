const mobilePattern = /^[6-9]\d{9}$/;

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizePhone(value) {
  let digits = digitsOnly(value);
  if (digits.startsWith('91') && digits.length > 11) digits = digits.slice(2);
  return digits;
}

export function isValidIndianMobile(value) {
  return mobilePattern.test(normalizePhone(value));
}

export function isValidIndianPhone(value) {
  const digits = normalizePhone(value);
  if (!digits) return false;
  if (mobilePattern.test(digits)) return true;
  return /^0\d{8,12}$/.test(digits);
}

export function formatPhone(value) {
  if (!value) return '';
  const digits = normalizePhone(value);
  if (mobilePattern.test(digits)) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.startsWith('0') && digits.length >= 10) {
    const splitAt = digits.length - 7;
    return `${digits.slice(0, splitAt)}-${digits.slice(splitAt)}`;
  }
  return value;
}

export function telHref(value) {
  const digits = normalizePhone(value);
  if (!digits) return '';
  return `tel:+91${digits.replace(/^0/, '')}`;
}

export function whatsappHref(value, text = '') {
  const digits = normalizePhone(value);
  const target = digits.length === 10 ? `91${digits}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${target}${query}`;
}

export function whatsappShareHref(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function directionsUrl(hospital) {
  const { lat, lng } = hospital?.location || {};
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function timeAgo(iso, t) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 60 * 1000) return t('results.justNow');
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return t('results.minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('results.hoursAgo', { n: hours });
  return t('results.daysAgo', { n: Math.floor(hours / 24) });
}

export function formatDate(iso, lang = 'en') {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

export function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [hourRaw, minute = '00'] = hhmm.split(':');
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute} ${suffix}`;
}

export function formatDistance(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(1);
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

/** Client-side check used as fallback for cached responses. Timings are IST. */
export function isReceptionOpenNow(reception) {
  if (!reception) return true;
  if (reception.is24x7) return true;
  const open = reception.timings?.open;
  const close = reception.timings?.close;
  if (!open || !close) return true;
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const now = new Date();
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
  const openMinutes = toMinutes(open);
  const closeMinutes = toMinutes(close);
  if (openMinutes === closeMinutes) return true;
  return openMinutes < closeMinutes
    ? istMinutes >= openMinutes && istMinutes < closeMinutes
    : istMinutes >= openMinutes || istMinutes < closeMinutes;
}
