export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/ \(.*\)/, '');
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.floor(mins % 60);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatCountdown(totalMins) {
  if (totalMins <= 0) return '0:00';
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

export function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
