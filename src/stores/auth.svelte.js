const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || '';

let _isAuthenticated = $state(false);
let _token = $state(localStorage.getItem('sawm_auth_token') || '');
let _user = $state(null);
let _loading = $state(false);
let _error = $state('');

export function getAuth() {
  return {
    get isAuthenticated() { return _isAuthenticated; },
    get token() { return _token; },
    get user() { return _user; },
    get loading() { return _loading; },
    get error() { return _error; },
  };
}

function authUrl(path) {
  if (!CONVEX_URL) return '';
  // Convert .cloud URL to HTTP site URL for auth endpoints
  const base = CONVEX_URL.replace('.convex.cloud', '.convex.site');
  return `${base}${path}`;
}

export async function signIn(email, password) {
  _loading = true;
  _error = '';
  try {
    const res = await fetch(authUrl('/api/auth/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'password',
        params: { email, password, flow: 'signIn' },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'sign in failed');
    _token = data.token;
    _isAuthenticated = true;
    localStorage.setItem('sawm_auth_token', _token);
    return true;
  } catch (e) {
    _error = e.message;
    return false;
  } finally {
    _loading = false;
  }
}

export async function signUp(email, password) {
  _loading = true;
  _error = '';
  try {
    const res = await fetch(authUrl('/api/auth/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'password',
        params: { email, password, flow: 'signUp' },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'sign up failed');
    _token = data.token;
    _isAuthenticated = true;
    localStorage.setItem('sawm_auth_token', _token);
    return true;
  } catch (e) {
    _error = e.message;
    return false;
  } finally {
    _loading = false;
  }
}

export async function signOut() {
  try {
    if (_token) {
      await fetch(authUrl('/api/auth/signout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_token}`,
        },
      });
    }
  } catch (e) {
    // ignore signout errors
  }
  _token = '';
  _isAuthenticated = false;
  _user = null;
  localStorage.removeItem('sawm_auth_token');
}

export function clearError() {
  _error = '';
}

// Restore session on load
export function initAuth(convexClient) {
  if (_token) {
    _isAuthenticated = true;
    if (convexClient) {
      convexClient.setAuth(_token);
    }
  }
}

export function getConvexToken() {
  return _token;
}
