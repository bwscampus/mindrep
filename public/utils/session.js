// utils/session.js — ending a session.
//
// Separate from app.js so screens can offer "Sign Out" without importing the
// router (which imports the screens back, and circular module graphs are a
// bad place to keep something this load-bearing).

import { api } from './api.js';
import { flush, storage } from './storage.js';

export async function signOut() {
  // Push any debounced progress before giving up the cookie, or the last
  // few seconds of work are lost.
  try { await flush(); } catch { /* best effort */ }
  try { await api.logout(); } catch { /* session may already be gone */ }
  // Team iPads and school Chromebooks are shared. Leave nothing of this
  // athlete behind: no cached progress for the next sign-in to "migrate"
  // into their account, no reminders, no demo-mode flag.
  storage.clear();
  // A reload drops all in-memory state and re-enters boot(), which finds no
  // session and renders the sign-in screen.
  location.reload();
}

/** Permanently delete the account and its data. Throws ApiError on failure. */
export async function deleteAccount(password) {
  await api.deleteAccount(password);
  storage.clear();
  location.reload();
}
