import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || '';
const convex = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

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

export async function signIn(email, password) {
  _loading = true;
  _error = '';
  try {
    if (!convex) throw new Error('not configured');
    const result = await convex.action(api.auth.signIn, {
      provider: 'password',
      params: { email, password, flow: 'signIn' },
    });
    if (result.tokens && result.tokens.token) {
      _token = result.tokens.token;
      _isAuthenticated = true;
      _user = { email };
      localStorage.setItem('sawm_auth_token', _token);
      localStorage.setItem('sawm_auth_email', email);
      if (result.tokens.refreshToken) {
        localStorage.setItem('sawm_auth_refresh', result.tokens.refreshToken);
      }
      // Fetch profile to get displayName
      try {
        convex.setAuth(_token);
        const profile = await convex.query(api.users.getProfile, {});
        if (profile?.displayName) {
          _user = { email, displayName: profile.displayName };
          localStorage.setItem('sawm_auth_displayName', profile.displayName);
        }
      } catch (_) { /* profile fetch is best-effort */ }
      return true;
    }
    throw new Error('sign in failed. no token returned');
  } catch (e) {
    _error = e.message || 'sign in failed';
    return false;
  } finally {
    _loading = false;
  }
}

export async function signUp(email, password, displayName) {
  _loading = true;
  _error = '';
  try {
    if (!convex) throw new Error('not configured');
    const result = await convex.action(api.auth.signIn, {
      provider: 'password',
      params: { email, password, flow: 'signUp' },
    });
    if (result.tokens && result.tokens.token) {
      _token = result.tokens.token;
      _isAuthenticated = true;
      _user = { email, displayName: displayName || undefined };
      localStorage.setItem('sawm_auth_token', _token);
      localStorage.setItem('sawm_auth_email', email);
      if (result.tokens.refreshToken) {
        localStorage.setItem('sawm_auth_refresh', result.tokens.refreshToken);
      }
      // Create profile with displayName
      if (displayName) {
        try {
          convex.setAuth(_token);
          await convex.mutation(api.users.updateProfile, { displayName });
          localStorage.setItem('sawm_auth_displayName', displayName);
        } catch (_) { /* profile create is best-effort */ }
      }
      return true;
    }
    throw new Error('sign up failed. no token returned');
  } catch (e) {
    _error = e.message || 'sign up failed';
    return false;
  } finally {
    _loading = false;
  }
}

export async function signOut() {
  try {
    if (convex && _token) {
      convex.setAuth(_token);
      await convex.action(api.auth.signOut, {});
    }
  } catch (e) {
    // ignore signout errors
  }
  _token = '';
  _isAuthenticated = false;
  _user = null;
  localStorage.removeItem('sawm_auth_token');
  localStorage.removeItem('sawm_auth_refresh');
  localStorage.removeItem('sawm_auth_email');
  localStorage.removeItem('sawm_auth_displayName');
}

export function clearError() {
  _error = '';
}

// Restore session on load
export function initAuth(convexClient) {
  if (_token) {
    _isAuthenticated = true;
    const savedEmail = localStorage.getItem('sawm_auth_email');
    const savedName = localStorage.getItem('sawm_auth_displayName');
    if (savedEmail) _user = { email: savedEmail, displayName: savedName || undefined };
    if (convexClient) {
      convexClient.setAuth(_token);
    }
  }
}

export function getConvexToken() {
  return _token;
}

export async function updateDisplayName(name) {
  if (!convex || !_token) return;
  convex.setAuth(_token);
  await convex.mutation(api.users.updateProfile, { displayName: name });
  _user = { ..._user, displayName: name };
  if (name) {
    localStorage.setItem('sawm_auth_displayName', name);
  } else {
    localStorage.removeItem('sawm_auth_displayName');
  }
}

export function getConvexClient() {
  if (convex && _token) {
    convex.setAuth(_token);
  }
  return convex;
}
