// utils/storage.js — localStorage helpers

const PREFIX = 'mindrep_';

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

export function getUser() {
  return storage.get('user', null);
}

export function saveUser(user) {
  storage.set('user', user);
}

export function getProgress() {
  return storage.get('progress', {
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
    activityResults: {}
  });
}

export function saveProgress(progress) {
  storage.set('progress', progress);
}

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
