import { reverseGeocode } from '../lib/prayerApi.js';

let _lat = $state(null);
let _lng = $state(null);
let _city = $state('');
let _stateName = $state('');
let _locationName = $state('');
let _loading = $state(true);
let _error = $state(false);

export function getLocation() {
  return {
    get lat() { return _lat; },
    get lng() { return _lng; },
    get city() { return _city; },
    get state() { return _stateName; },
    get locationName() { return _locationName; },
    get loading() { return _loading; },
    get error() { return _error; },
  };
}

export async function initLocation() {
  _loading = true;
  _error = false;

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
    _lat = pos.coords.latitude;
    _lng = pos.coords.longitude;
  } catch (e) {
    // Fallback: Mesa, AZ
    _lat = 33.4152;
    _lng = -111.8315;
    _error = true;
  }

  // Reverse geocode for city/state
  const geo = await reverseGeocode(_lat, _lng);
  if (geo) {
    _city = geo.city;
    _stateName = geo.state;
    _locationName = [geo.city, geo.state].filter(Boolean).join(', ');
  } else {
    _locationName = `${_lat.toFixed(2)}, ${_lng.toFixed(2)}`;
  }

  _loading = false;
}
