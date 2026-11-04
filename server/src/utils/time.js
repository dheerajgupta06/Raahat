// Reception timings are always interpreted in IST (UTC+5:30, no DST).

export function parseHHMM(value) {
  if (typeof value !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesInIST(date = new Date()) {
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + 330;
  return ((minutes % 1440) + 1440) % 1440;
}

export function isReceptionOpen(reception, hospitalIs24x7, now = new Date()) {
  // A 24x7 emergency department does not imply a 24x7 reception desk, so the
  // reception schedule wins whenever it is configured.
  if (!reception) return Boolean(hospitalIs24x7);
  if (reception.is24x7) return true;
  const open = parseHHMM(reception?.timings?.open);
  const close = parseHHMM(reception?.timings?.close);
  if (open === null || close === null || open === close) return true;
  const current = minutesInIST(now);
  return open < close
    ? current >= open && current < close
    : current >= open || current < close;
}

export function formatTimings(reception) {
  if (reception?.is24x7) return '24x7';
  const open = reception?.timings?.open || '09:00';
  const close = reception?.timings?.close || '21:00';
  return `${to12h(open)} - ${to12h(close)}`;
}

function to12h(hhmm) {
  const [hRaw, m] = hhmm.split(':').map(Number);
  const suffix = hRaw >= 12 ? 'PM' : 'AM';
  const hour = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
