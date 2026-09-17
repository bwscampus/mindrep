// app.js — Main router and navigation shell

import { renderOnboarding } from './screens/onboarding.js';
import { renderHome, attachHomeEvents } from './screens/home.js';
import { renderLesson } from './screens/lesson.js';
import { renderDailyRep } from './screens/dailyrep.js';
import { renderWeeklyCheckin } from './screens/weeklycheckin.js';
import { renderModules, attachModulesEvents } from './screens/modules.js';
import { renderPractice, attachPracticeEvents } from './screens/practice.js';
import { renderTracker, attachTrackerEvents } from './screens/tracker.js';
import { renderAchievements, attachAchievementsEvents } from './screens/achievements.js';
import { getUser, getProgress, saveProgress, updateStreak } from './utils/storage.js';

// Clean line icons (currentColor strokes) for the bottom nav — no emoji,
// no text labels. Active state is shown with a small dot underneath instead.
const NAV_ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/></svg>`,
  modules: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z"/><path d="M12 6v13"/></svg>`,
  practice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M4 9v6M20 9v6"/><path d="M7 8v8M17 8v8"/></svg>`,
  tracker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V10M12 19V5M19 19v-7"/><path d="M4 19h16"/></svg>`,
  achievements: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.4"/><path d="M5.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/></svg>`
};

const NAV_ITEMS = [
  { id: 'home',         label: 'Home' },
  { id: 'modules',      label: 'Learn' },
  { id: 'practice',     label: 'Practice' },
  { id: 'tracker',      label: 'Tracker' },
  { id: 'achievements', label: 'Profile' }
];

function navigate(screen, params = {}) {
  // Lesson player is full-screen (no nav)
  if (screen === 'lesson') {
    document.getElementById('nav-bar')?.remove();
    renderLesson(params.lessonId, navigate);
    return;
  }

  renderNav(screen);
  renderScreen(screen, params);
}

function renderNav(active) {
  let nav = document.getElementById('nav-bar');
  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'nav-bar';
    nav.className = 'nav-bar';
    document.body.appendChild(nav);
  }
  nav.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-item ${active === item.id ? 'active' : ''}" data-screen="${item.id}" id="nav-${item.id}" aria-label="${item.label}" title="${item.label}">
      <span class="nav-icon">${NAV_ICONS[item.id]}</span>
      <span class="nav-dot"></span>
    </button>
  `).join('');

  NAV_ITEMS.forEach(item => {
    document.getElementById(`nav-${item.id}`)?.addEventListener('click', () => navigate(item.id));
  });
}

function renderScreen(screen, params = {}) {
  const app = document.getElementById('app');

  switch (screen) {
    case 'home':
      app.innerHTML = renderHome(navigate);
      attachHomeEvents(navigate);
      break;
    case 'modules':
      app.innerHTML = renderModules(navigate);
      attachModulesEvents(navigate);
      break;
    case 'practice':
      app.innerHTML = renderPractice(navigate, params);
      attachPracticeEvents(navigate);
      break;
    case 'tracker':
      app.innerHTML = renderTracker(navigate, params);
      attachTrackerEvents(navigate);
      break;
    case 'achievements':
      app.innerHTML = renderAchievements(navigate);
      attachAchievementsEvents(navigate);
      break;
    case 'dailyrep':
      renderDailyRep(navigate); // sets #app innerHTML itself, like renderLesson
      break;
    case 'weeklycheckin':
      renderWeeklyCheckin(navigate); // sets #app innerHTML itself, like renderLesson
      break;
  }
}

// Boot
function boot() {
  const progress = getProgress();
  const updated = updateStreak(progress);
  saveProgress(updated);

  const user = getUser();
  if (!user) {
    document.getElementById('nav-bar')?.remove();
    renderOnboarding((newUser) => { navigate('home'); });
  } else {
    // Check for upcoming game reminder
    checkGameReminder(user);
    navigate('home');
  }
}

let reminderFired = false;
let reminderInterval = null;

function checkGameReminder(user) {
  const remindersOn  = localStorage.getItem('mindrep_reminders') === 'true';
  const nextGameTime = parseInt(localStorage.getItem('mindrep_next_game') || '0');
  if (!remindersOn || !nextGameTime || reminderFired) return;

  const now       = Date.now();
  const diffMs    = nextGameTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  // Fire when the game is within 2 hours and hasn't happened yet.
  // NOTE: this only fires while the app tab is open — a real "notify me even
  // when the app is closed" reminder needs a backend + service worker push
  // subscription, which this client-only prototype doesn't have (see ROADMAP.md).
  if (diffHours > 0 && diffHours <= 2) {
    reminderFired = true;
    if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null; }
    setTimeout(() => fireGameReminder(user), 1200); // small delay so the app renders first
    return;
  }

  // Not in-window yet — keep checking while the app stays open so the
  // reminder still fires if the user opened the app hours before game time.
  if (!reminderInterval) {
    reminderInterval = setInterval(() => checkGameReminder(user), 60 * 1000);
  }
}

function fireGameReminder(user) {
  // Native OS notification, if the user granted permission
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`Game Day, ${user?.name || 'Athlete'}!`, {
        body: 'Open your 3-min pre-game mental warm-up.',
        icon: undefined
      });
    } catch { /* some browsers restrict Notification outside a user gesture context */ }
  }

  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed;top:16px;left:50%;transform:translateX(-50%);
    z-index:9001;width:calc(100% - 32px);max-width:400px;
    background:linear-gradient(135deg,rgba(94,234,212,0.12),rgba(168,175,189,0.08));
    border:1px solid rgba(94,234,212,0.3);border-radius:10px;
    padding:16px 18px;backdrop-filter:blur(20px);
    font-family:'Barlow Condensed',sans-serif;
    animation:fadeUp .3s ease;
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="font-size:1.6rem;flex-shrink:0">🎯</div>
      <div style="flex:1">
        <div style="font-weight:900;font-size:1rem;text-transform:uppercase;letter-spacing:.04em;color:#F1F5F9">Game Day, ${user?.name || 'Athlete'}!</div>
        <div style="font-size:.82rem;color:rgba(241,245,249,.7);margin-top:2px;font-family:'Inter',sans-serif;line-height:1.4">Open your 3-min pre-game mental warm-up.</div>
      </div>
      <button id="reminder-banner-close" style="background:none;border:none;color:#64748B;font-size:1.1rem;cursor:pointer;padding:0 4px;flex-shrink:0">✕</button>
    </div>
    <button id="reminder-banner-cta" class="btn btn-primary btn-sm" style="width:100%;margin-top:12px;font-size:.8rem">Open Pre-Game Warm-Up →</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('reminder-banner-close')?.addEventListener('click', () => banner.remove());
  document.getElementById('reminder-banner-cta')?.addEventListener('click', () => {
    banner.remove();
    navigate('practice', { tab: 'checklist' });
  });
}

boot();

