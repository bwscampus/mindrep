// utils/api.js — thin wrapper over the FastAPI backend.
//
// Authentication is an httpOnly session cookie, so there is no token to store
// or attach here: the browser sends it automatically and JavaScript cannot
// read it. That is the point — an XSS bug on this page cannot walk off with
// a credential.

const BASE = '/api';

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { method = 'GET', json, form, keepalive = false } = {}) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: {},
    keepalive
  };

  if (json !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  } else if (form !== undefined) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams(form).toString();
  }

  const response = await fetch(BASE + path, options);

  if (response.status === 204 || response.status === 205) return null;

  let payload = null;
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new ApiError(response.status, detailOf(payload));
  }
  return payload;
}

// FastAPI returns `detail` as a string, or as a list of validation errors.
function detailOf(payload) {
  if (!payload) return null;
  const detail = payload.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || String(e)).join('. ');
  }
  if (detail && typeof detail === 'object') {
    return detail.reason || detail.code || null;
  }
  return null;
}

export const api = {
  // Returns the signed-in user, or null when there is no valid session.
  async me() {
    try {
      return await request('/users/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  // fastapi-users' login route speaks OAuth2 form encoding, not JSON.
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      form: { username: email, password }
    });
  },

  register(email, password) {
    return request('/auth/register', { method: 'POST', json: { email, password } });
  },

  logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  // Always resolves the same way whether or not the account exists.
  forgotPassword(email) {
    return request('/auth/forgot-password', { method: 'POST', json: { email } });
  },

  resetPassword(token, password) {
    return request('/auth/reset-password', { method: 'POST', json: { token, password } });
  },

  getState() {
    return request('/state');
  },

  putState(profile, progress, { keepalive = false } = {}) {
    return request('/state', { method: 'PUT', json: { profile, progress }, keepalive });
  }
};
