// utils/storage.js — athlete profile + progress, synced to the backend.
//
// The public API here is deliberately unchanged and deliberately synchronous.
// getProgress()/saveProgress() are called from ~60 places, many of them inside
// render functions that build HTML strings and cannot await anything. So:
//
//   - hydrate() runs once at boot and fills an in-memory cache.
//   - getProgress()/getUser() read that cache synchronously.
//   - saveProgress()/saveUser() update the cache synchronously, then schedule
//     a debounced PUT. Callers never wait on the network.
//
// The cost is last-write-wins: two devices editing at once, the later write
// wins and the earlier one is lost. Acceptable for one athlete's own progress.

import { api, ApiError } from './api.js';

const PREFIX = 'mindrep_';
const SYNC_DEBOUNCE_MS = 800;

// Device-local storage. Still used directly for things that SHOULD stay on one
// device (notification prefs, demo mode) — see the reminder keys in app.js.
export const storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(PREFIX + key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { }
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  clear() {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
  }
};

export function defaultProgress() {
  return {
    completedLessons: [],
    completedModules: [],
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    badges: [],
    journalEntries: [],
    gameLog: [],
    sliderBaselines: null,
    neutralPhrase: null,
    resetRoutine: null,
    controlList: null,
    dailyReps: {},
    weeklyCheckins: [],
    activityResults: {},
    coachChat: []
  };
}

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

let _profile = null;
let _progress = defaultProgress();
let _hydrated = false;
let _syncTimer = null;
let _syncing = false;
let _dirty = false;
let _onSyncError = null;

export function isHydrated() {
  return _hydrated;
}

export function onSyncError(handler) {
  _onSyncError = handler;
}

/**
 * Load this athlete's state from the server into the cache. Call once, after
 * the session is known to be valid, before rendering any screen.
 */
export async function hydrate() {
  const state = await api.getState();
  _profile = state.profile || null;
  // Merge over defaults so a progress document written by an older version of
  // the app still has every key today's screens expect.
  _progress = { ...defaultProgress(), ...(state.progress || {}) };
  _hydrated = true;

  await migrateLocalProgress();
  return { profile: _profile, progress: _progress };
}

/**
 * One-time upgrade path for athletes who used the localStorage-only version.
 * If this device has progress and the account has none, adopt the local copy
 * so nobody loses their streak on the day accounts shipped.
 */
async function migrateLocalProgress() {
  if (storage.get('migrated', false)) return;

  const localProgress = storage.get('progress', null);
  const localUser = storage.get('user', null);
  const serverIsEmpty = !_profile && (_progress.xp || 0) === 0
    && (_progress.completedLessons || []).length === 0;

  if (localProgress && serverIsEmpty) {
    _progress = { ...defaultProgress(), ...localProgress };
    if (localUser) _profile = localUser;
    // Fold in the one chat history that used to live outside `progress`.
    const legacyChat = readLegacyCoachChat();
    if (legacyChat.length && !(_progress.coachChat || []).length) {
      _progress.coachChat = legacyChat;
    }
    await flush();
  }

  storage.set('migrated', true);
}

function readLegacyCoachChat() {
  try {
    return JSON.parse(localStorage.getItem('mindrep_coach_chat') || '[]');
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Public accessors — same signatures as the localStorage-only version
// ---------------------------------------------------------------------------

export function getUser() {
  return _profile;
}

export function saveUser(user) {
  _profile = user;
  queueSync();
}

export function getProgress() {
  return _progress;
}

export function saveProgress(progress) {
  _progress = progress;
  queueSync();
}

/** Coach chat history — stored inside progress so it follows the athlete. */
export function getCoachChat() {
  return _progress.coachChat || [];
}

export function saveCoachChat(history) {
  _progress.coachChat = history;
  queueSync();
}

/** Wipe this athlete's progress locally and on the server. */
export async function resetAll() {
  _profile = null;
  _progress = defaultProgress();
  storage.clear();
  await api.putState(null, _progress);
}

// ---------------------------------------------------------------------------
// Write-behind sync
// ---------------------------------------------------------------------------

function queueSync() {
  _dirty = true;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => { flush(); }, SYNC_DEBOUNCE_MS);
}

/**
 * Push the cache to the server now. Safe to call at any time; overlapping
 * calls collapse into one in-flight request plus a follow-up if needed.
 */
export async function flush({ keepalive = false } = {}) {
  if (!_hydrated || !_dirty || _syncing) return;

  if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
  _syncing = true;
  _dirty = false;

  try {
    await api.putState(_profile, _progress, { keepalive });
  } catch (error) {
    _dirty = true; // keep it pending so the next save retries
    if (error instanceof ApiError && error.status === 401) {
      _onSyncError?.(error);
    } else {
      console.warn('Progress sync failed; will retry on next save.', error);
    }
  } finally {
    _syncing = false;
  }
}

// Last chance to persist before the tab goes away. `keepalive` lets the
// request outlive the page; sendBeacon can't be used because it only sends
// POST and this endpoint is a PUT.
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush({ keepalive: true });
  });
  window.addEventListener('pagehide', () => flush({ keepalive: true }));
}

// ---------------------------------------------------------------------------
// Pure helpers — unchanged
// ---------------------------------------------------------------------------

export function updateStreak(progress) {
  const today = new Date().toDateString();
  const last = progress.lastActiveDate;
  if (last === today) return progress;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last === yesterday) {
    progress.streak += 1;
  } else if (last !== today) {
    progress.streak = 1;
  }
  progress.lastActiveDate = today;
  return progress;
}

export function addXP(progress, amount) {
  progress.xp += amount;
  const thresholds = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000];
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (progress.xp >= thresholds[i]) { level = i + 1; break; }
  }
  progress.level = level;
  return progress;
}

export const LEVEL_NAMES = ['', 'Rookie', 'Competitor', 'Athlete', 'Varsity', 'All-Star', 'Pro', 'Elite', 'Champion', 'Legend', 'Mental Captain'];

export function getXPForLevel(level) {
  const thresholds = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000];
  const next = thresholds[level] || thresholds[thresholds.length - 1];
  const curr = thresholds[level - 1] || 0;
  return { current: curr, next, label: LEVEL_NAMES[level] || 'Mental Captain' };
}
