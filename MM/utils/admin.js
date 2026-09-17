// utils/admin.js — Admin mode: secret access for the app owner

import { storage } from './storage.js';

// Secret passphrase — change this to whatever you want
const ADMIN_PASSPHRASE = 'mindrepGOD2026';

export function isAdmin() {
  return storage.get('admin_mode', false) === true;
}

export function activateAdmin(passphrase) {
  if (passphrase.trim() === ADMIN_PASSPHRASE) {
    storage.set('admin_mode', true);
    return true;
  }
  return false;
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
