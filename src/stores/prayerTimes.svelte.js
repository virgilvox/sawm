import { fetchPrayerTimes } from '../lib/prayerApi.js';

let _timings = $state(null);
let _meta = $state(null);
let _loading = $state(false);
let _method = $state(parseInt(localStorage.getItem('sawm_method') || '2'));

export function getPrayerTimes() {
  return {
    get timings() { return _timings; },
    get meta() { return _meta; },
    get loading() { return _loading; },
    get method() { return _method; },
  };
}

export async function loadPrayerTimes(lat, lng, method) {
  if (method !== undefined) {
    _method = method;
    localStorage.setItem('sawm_method', String(method));
  }
  _loading = true;
  try {
    const data = await fetchPrayerTimes(lat, lng, _method);
    _timings = data.timings;
    _meta = data.meta;
  } catch (e) {
    console.error('Failed to load prayer times:', e);
  }
  _loading = false;
}
