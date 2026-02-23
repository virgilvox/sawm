import { todayStr } from './timeUtils.js';

export async function fetchPrayerTimes(lat, lng, method) {
  const today = todayStr();
  const [y, m, d] = today.split('-');
  const url = `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await res.json();
    return {
      city: data.city || data.locality || '',
      state: data.principalSubdivision || '',
      country: data.countryName || '',
    };
  } catch (e) {
    return null;
  }
}
