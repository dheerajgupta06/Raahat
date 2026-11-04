const PREFIX = 'raahat.cache.v1.';
const MAX_QUERY_KEYS = 6;

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function resultsKey(params) {
  return `${PREFIX}results.${params.problem}.${params.radius}.${Number(params.lat).toFixed(3)}.${Number(params.lng).toFixed(3)}`;
}

function pruneQueryKeys() {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${PREFIX}results.`));
    if (keys.length <= MAX_QUERY_KEYS) return;
    const withTime = keys.map((key) => {
      const entry = readJSON(key, null);
      return { key, savedAt: entry?.savedAt || '' };
    });
    withTime.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    withTime.slice(0, withTime.length - MAX_QUERY_KEYS).forEach(({ key }) => removeKey(key));
  } catch {
    /* ignore */
  }
}

export function saveResults(params, payload) {
  const entry = {
    data: payload.data || [],
    meta: payload.meta || null,
    params,
    savedAt: new Date().toISOString(),
  };
  const key = resultsKey(params);
  writeJSON(key, entry);
  writeJSON(`${PREFIX}last`, entry);
  pruneQueryKeys();

  const hospitalMap = readJSON(`${PREFIX}hospitals`, {}) || {};
  for (const hospital of entry.data) hospitalMap[hospital.id] = { ...hospital, savedAt: entry.savedAt };
  const ids = Object.keys(hospitalMap);
  if (ids.length > 80) {
    ids.slice(0, ids.length - 80).forEach((id) => delete hospitalMap[id]);
  }
  writeJSON(`${PREFIX}hospitals`, hospitalMap);
}

export function readResults(params) {
  return readJSON(resultsKey(params), null);
}

export function readLastResults() {
  return readJSON(`${PREFIX}last`, null);
}

export function readCachedHospital(id) {
  const map = readJSON(`${PREFIX}hospitals`, {}) || {};
  return map[id] || null;
}

export function saveStats(payload) {
  writeJSON(`${PREFIX}stats`, { data: payload.data, savedAt: new Date().toISOString() });
}

export function readStats() {
  return readJSON(`${PREFIX}stats`, null);
}
