function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchNearbyMosques(lat, lng, radiusKm = 5) {
  const radiusM = radiusKm * 1000;
  const query = `[out:json][timeout:10];(nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});nwr["building"="mosque"](around:${radiusM},${lat},${lng}););out center;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const data = await res.json();
  const seen = new Set();

  const mosques = data.elements
    .map(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;

      const name = el.tags?.name || el.tags?.['name:en'] || 'Mosque';
      const key = `${name}-${elLat.toFixed(4)}-${elLng.toFixed(4)}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const addr = [
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ].filter(Boolean).join(', ');

      return {
        name,
        address: addr || null,
        lat: elLat,
        lng: elLng,
        distance: haversineDistance(lat, lng, elLat, elLng),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  return mosques;
}

export function formatDistance(km, unit = 'km') {
  if (unit === 'mi') {
    const mi = km * 0.621371;
    if (mi < 0.1) return `${Math.round(mi * 5280)}ft`;
    return `${mi.toFixed(1)}mi`;
  }
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function openInMaps(lat, lng, name) {
  const q = encodeURIComponent(name);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.open(`maps://maps.apple.com/?q=${q}&ll=${lat},${lng}`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
}
