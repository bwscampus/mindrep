// utils/admin.js — Demo mode: preview every module for testing and demos.
//
// Only accounts the server marks `is_superuser` can turn it on. It used to be
// a passphrase in this file, but the repo is public, so anyone could read it.
// Grant the flag in the database (UPDATE users SET is_superuser = true ...);
// users cannot set it on themselves.
//
// This only changes what the browser shows. Anything that must really be paid
// for has to be enforced by the server (Production Standard FE-3).

import { storage } from './storage.js';

let accountIsSuperuser = false;

/** Record the signed-in account (from GET /api/users/me). */
export function setAccount(me) {
  accountIsSuperuser = me?.is_superuser === true;
}

export function canUseDemoMode() {
  return accountIsSuperuser;
}

export function isAdmin() {
  return accountIsSuperuser && storage.get('admin_mode', false) === true;
}

export function activateAdmin() {
  if (!accountIsSuperuser) return false;
  storage.set('admin_mode', true);
  return true;
}

export function deactivateAdmin() {
  storage.set('admin_mode', false);
}

// Admin-unlocked progress: mark everything as complete
export function applyAdminUnlock(progress) {
  const allLessonIds = ['1.1','1.2','1.3','2.1','2.2','2.3','3.1','3.2','3.3','4.1','4.2','4.3','5.1','5.2','5.3','6.1','6.2','6.3','7.1','7.2','7.3'];
  progress.completedLessons = [...new Set([...progress.completedLessons, ...allLessonIds])];
  progress.completedModules = [1,2,3,4,5,6,7];
  progress.xp = Math.max(progress.xp, 9999);
  progress.level = 10;
  progress.streak = Math.max(progress.streak, 30);
  progress.badges = [
    'first_lesson','module_1','streak_3','streak_7','neutral_thinker',
    'reset_master','journal_1','quiz_perfect','breathwork','no_excuses','captain','xp_500'
  ];
  return progress;
}
