// screens/home.js

import { MODULES, SPORTS } from '../data/lessons.js';
import { getProgress, getUser } from '../utils/storage.js';
import { moduleIcon } from '../utils/illustrations.js';
import { isLockedIn } from '../utils/lockedIn.js';
import { getTodayRep } from '../data/dailyReps.js';
import { isWeeklyCheckinDue } from '../utils/weekly.js';

// Simple line icons for the practice/journal tiles — same visual language
// as the bottom nav (currentColor strokes, no emoji).
const TILE_ICONS = {
  breathe:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 3 3 7 0 10-3 3-3 7 0 8"/><path d="M12 21c-4-1-7-4-7-8a7 7 0 0 1 7-7"/><path d="M12 21c4-1 7-4 7-8a7 7 0 0 0-3-5.8"/></svg>`,
  toolbox:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5h17v10a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18.5z"/><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5"/><path d="M3.5 12.5h17"/><path d="M10.5 12.5v2.2h3v-2.2"/></svg>`,
  weekly:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9.5h16"/><path d="M12 13v3.2l2.2 1.3"/></svg>`,
  checklist: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8 9.5l1.6 1.6L13 7.7M8 16h6"/></svg>`,
  visualize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>`,
  coach:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3.2V16.5h-1a2 2 0 0 1-2-2z"/></svg>`,
  log:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 15.5h6"/></svg>`,
  history:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4.5V8h3.5"/><path d="M12 8v4.5l3 2"/></svg>`,
  trends:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l5-5 4 3 6-7"/><path d="M14 6.5h5V11.5"/></svg>`,
  more:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v15M4.5 12h15"/></svg>`
};

let activeHomeTab = 'today';

export function renderHome(navigate) {
  const user = getUser();
  const progress = getProgress();
  const sport = SPORTS.find(s => s.id === user?.sport) || SPORTS[0];

  const streak  = progress.streak || 0;
  const xp      = progress.xp || 0;
  const completed = progress.completedLessons || [];
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Find next lesson
  let nextLesson = null, nextModule = null;
  for (const mod of MODULES) {
    if (mod.locked) continue;
    for (const lesson of mod.lessons) {
      if (!completed.includes(lesson.id)) { nextLesson = lesson; nextModule = mod; break; }
    }
    if (nextLesson) break;
  }

  // Once every unlocked lesson is done, Home shifts from "teach" to "train":
  // the featured card promotes today's rep instead of the next lesson.
  const lockedIn = isLockedIn(progress);
  const todayRep = lockedIn ? getTodayRep() : null;
  const repDoneToday = lockedIn && !!(progress.dailyReps || {})[new Date().toDateString()];

  return `
    <div class="screen" style="padding-top:20px">

      <!-- Personalized greeting header -->
      <div class="app-header">
        <div class="app-greeting">Hey, ${user?.name || 'Athlete'}! ${sport.emoji}</div>
        <div class="app-date">${dateStr}</div>
      </div>

      <!-- Featured summary card -->
      <div class="featured-card" id="featured-card">
        ${lockedIn ? (repDoneToday ? `
          <div class="fc-eyebrow">✅ Today's Rep Complete</div>
          <div class="fc-title">Nice work, ${user?.name || 'Athlete'}!</div>
          <div class="fc-sub">Come back tomorrow for a new rep. Your Toolbox is always open below.</div>
        ` : `
          <div class="fc-eyebrow">🎯 Today's Rep · ${todayRep.skill}</div>
          <div class="fc-title">${todayRep.title}</div>
          <div class="fc-sub">A quick mental rep to keep your edge sharp — about a minute.</div>
        `) : `
          <div class="fc-eyebrow">📚 Today's Mental Prep</div>
          <div class="fc-title">${nextLesson.title}</div>
          <div class="fc-sub">${nextModule.title} · ${nextLesson.duration} min lesson</div>
        `}
        <div class="fc-meta">
          <div class="fc-stat">
            <span class="fc-stat-num">${streak}</span>
            <span class="fc-stat-label">day streak</span>
          </div>
          <div class="fc-stat">
            <span class="fc-stat-num">${xp}</span>
            <span class="fc-stat-label">total XP</span>
          </div>
        </div>
      </div>

      <!-- Pill filter tabs -->
      <div class="pill-tabs">
        <button class="pill-tab ${activeHomeTab === 'today'    ? 'active' : ''}" data-hometab="today">Today</button>
        <button class="pill-tab ${activeHomeTab === 'lessons'  ? 'active' : ''}" data-hometab="lessons">Lessons</button>
        <button class="pill-tab ${activeHomeTab === 'journal'  ? 'active' : ''}" data-hometab="journal">Journal</button>
      </div>

      <!-- Tile grid -->
      <div class="tile-grid" id="home-tile-grid">
        ${buildTileGrid(activeHomeTab, progress)}
      </div>

      <!-- Module Journey -->
      <div class="section-heading" style="margin-top:26px">Your Journey</div>
      ${MODULES.slice(0, 3).map(mod => {
        const modLessons   = mod.lessons;
        const modCompleted = modLessons.filter(l => completed.includes(l.id)).length;
        const modPct       = Math.round((modCompleted / modLessons.length) * 100);
        const isLocked     = mod.locked;
        const isComplete   = modCompleted === modLessons.length;
        const stripe       = isComplete ? 'var(--teal)' : modCompleted > 0 ? 'var(--teal)' : (isLocked ? 'var(--muted)' : mod.color);
        return `
          <div class="module-card glass ${isLocked ? 'locked' : ''}"
               style="border-left:4px solid ${stripe};margin-bottom:10px${isLocked ? ';cursor:default' : ''}"
               ${!isLocked ? `id="module-go-${mod.id}"` : ''}>
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
              <div style="display:flex;align-items:flex-start;gap:12px">
                <div class="tile-icon-badge ${modCompleted > 0 ? 'accent' : ''}" style="width:36px;height:36px">
                  ${moduleIcon(mod.id, isLocked ? 'var(--muted)' : (modCompleted > 0 ? 'var(--teal)' : 'var(--muted2)'), 18)}
                </div>
                <div>
                  <div class="module-num" style="text-transform:none;letter-spacing:0;font-weight:600;font-size:.7rem">Module ${mod.id}</div>
                  <div class="module-title" style="text-transform:none;letter-spacing:0;font-family:var(--font-ui);font-size:1.05rem">${mod.title}</div>
                </div>
              </div>
              ${isComplete ? `<div style="font-size:1.2rem;flex-shrink:0">✅</div>` :
                isLocked   ? `<div class="lock-icon">🔒</div>` :
                `<div class="tile-pill ${modCompleted === 0 ? '' : 'accent'}">${modCompleted === 0 ? 'Start' : 'In Progress'}</div>`}
            </div>
            <div style="font-size:.83rem;color:var(--muted2);margin-bottom:10px;font-family:var(--font-body)">${mod.description}</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="xp-bar-wrap" style="flex:1">
                <div class="xp-bar" style="width:${modPct}%"></div>
              </div>
              <div style="font-family:var(--font-numeral);font-size:.85rem;font-weight:700;color:var(--muted2)">${modCompleted}/${modLessons.length}</div>
            </div>
          </div>
        `;
      }).join('')}
      <button class="btn btn-secondary btn-block mt-8" id="view-all-modules" style="margin-bottom:8px">View All 7 Modules →</button>

      <!-- Credibility Section -->
      <div class="section-heading" style="margin-top:24px">Why It Works</div>
      <div class="glass" style="padding:22px;margin-bottom:8px">
        <div style="font-family:var(--font-ui);font-size:1.05rem;font-weight:700;margin-bottom:16px">Built on Proven Principles</div>
        ${[
          { icon: '🏈', text: 'This system is built on the mental performance training methods elite football, Olympic, and pro programs actually use.' },
          { icon: '🧠', text: 'Neutral thinking is backed by behavioral psychology research on cognitive reframing.' },
          { icon: '📱', text: 'Micro-learning (5 min/day) is proven more effective than long study sessions for habit formation.' }
        ].map(b => `
          <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="border-left:2px solid var(--teal);padding-left:10px;font-size:.87rem;font-family:var(--font-body);color:var(--muted2);line-height:1.55">${b.icon}&nbsp; ${b.text}</div>
          </div>
        `).join('')}
        <div style="margin-top:14px;font-style:italic;font-size:.8rem;color:var(--muted);font-family:var(--font-body);line-height:1.5">Every lesson in MindRep is adapted from Trevor Moad's mental performance coaching.</div>
      </div>

      <div style="height:12px"></div>
    </div>
  `;
}

function buildTileGrid(tab, progress) {
  const completed = progress.completedLessons || [];

  if (tab === 'today') {
    const tools = [
      { id: 'breathe',   icon: 'breathe',   title: 'Breathe',    sub: 'Box breathing · 2 min',   nav: ['practice', { tab: 'breathe' }] },
      { id: 'checklist', icon: 'checklist', title: 'Pre-Game',   sub: 'Readiness checklist',      nav: ['practice', { tab: 'checklist' }] },
      { id: 'visualize', icon: 'visualize', title: 'Visualize',  sub: 'Guided mental reps',       nav: ['practice', { tab: 'visualize' }] },
      { id: 'coach',     icon: 'coach',     title: 'Coach',      sub: 'Ask Coach Neutral',        nav: ['practice', { tab: 'coach' }] }
    ];
    // Locked In athletes (Foundations complete) get a shortcut to their
    // Toolbox alongside the everyday practice tools, plus a nudge toward
    // the Weekly Check-in whenever one is actually due.
    if (isLockedIn(progress)) {
      if (isWeeklyCheckinDue(progress)) {
        tools.push({ id: 'weekly', icon: 'weekly', title: 'Weekly Check-In', sub: 'Due this week', nav: ['weeklycheckin', {}] });
      }
      tools.push({ id: 'toolbox', icon: 'toolbox', title: 'My Toolbox', sub: 'Your mental tools', nav: ['achievements', {}] });
    }
    return tools.map(t => `
      <div class="tile-card" id="tile-${t.id}" data-nav-screen="${t.nav[0]}" data-nav-params='${JSON.stringify(t.nav[1])}'>
        <div class="tile-icon-badge accent" style="color:var(--teal)">${TILE_ICONS[t.icon]}</div>
        <div class="tile-body">
          <div class="tile-title">${t.title}</div>
          <div class="tile-sub">${t.sub}</div>
        </div>
        <div class="tile-status"><span style="color:var(--muted);font-size:.85rem">→</span></div>
      </div>
    `).join('');
  }

  if (tab === 'journal') {
    const tiles = [
      { id: 'log',     icon: 'log',     title: 'Log a Session', sub: 'Game or practice',        nav: ['tracker', { tab: 'journal' }] },
      { id: 'history', icon: 'history', title: 'History',       sub: 'Past entries',             nav: ['tracker', { tab: 'history' }] },
      { id: 'trends',  icon: 'trends',  title: 'Trends',        sub: 'Mental performance charts', nav: ['tracker', { tab: 'trends' }] }
    ];
    return tiles.map(t => `
      <div class="tile-card" id="tile-${t.id}" data-nav-screen="${t.nav[0]}" data-nav-params='${JSON.stringify(t.nav[1])}'>
        <div class="tile-icon-badge accent" style="color:var(--teal)">${TILE_ICONS[t.icon]}</div>
        <div class="tile-body">
          <div class="tile-title">${t.title}</div>
          <div class="tile-sub">${t.sub}</div>
        </div>
        <div class="tile-status"><span style="color:var(--muted);font-size:.85rem">→</span></div>
      </div>
    `).join('');
  }

  // 'lessons' tab — every lesson in the unlocked modules, plus a link to the
  // full 7-module map at the end.
  const unlocked = MODULES.filter(m => !m.locked);
  const lessonTiles = unlocked.flatMap(mod => mod.lessons.map(lesson => {
    const isDone = completed.includes(lesson.id);
    return `
      <div class="tile-card" id="tile-lesson-${lesson.id.replace('.', '-')}" data-nav-screen="lesson" data-nav-lesson="${lesson.id}">
        <div class="tile-icon-badge ${isDone ? 'accent' : ''}" style="color:${isDone ? 'var(--teal)' : 'var(--muted2)'}">${moduleIcon(mod.id, isDone ? 'var(--teal)' : 'var(--muted2)', 20)}</div>
        <div class="tile-body">
          <div class="tile-title">${lesson.title}</div>
          <div class="tile-sub">Module ${mod.id} · ${lesson.duration} min</div>
        </div>
        <div class="tile-status">
          <span class="tile-pill ${isDone ? 'done' : ''}">${isDone ? '✓ Done' : 'Start'}</span>
        </div>
      </div>
    `;
  }));

  lessonTiles.push(`
    <div class="tile-card" id="tile-more-modules">
      <div class="tile-icon-badge">${TILE_ICONS.more}</div>
      <div class="tile-body">
        <div class="tile-title">7 Modules Total</div>
        <div class="tile-sub">See the full journey</div>
      </div>
      <div class="tile-status"><span style="color:var(--muted);font-size:.85rem">→</span></div>
    </div>
  `);

  return lessonTiles.join('');
}

export function attachHomeEvents(navigate) {
  document.getElementById('featured-card')?.addEventListener('click', () => {
    const progress = getProgress();

    if (isLockedIn(progress)) {
      const doneToday = !!(progress.dailyReps || {})[new Date().toDateString()];
      navigate(doneToday ? 'achievements' : 'dailyrep');
      return;
    }

    const completed = progress.completedLessons || [];
    let next = null;
    for (const mod of MODULES) {
      if (mod.locked) continue;
      for (const lesson of mod.lessons) {
        if (!completed.includes(lesson.id)) { next = lesson; break; }
      }
      if (next) break;
    }
    if (next) navigate('lesson', { lessonId: next.id });
  });

  document.getElementById('view-all-modules')?.addEventListener('click', () => navigate('modules'));
  document.getElementById('tile-more-modules')?.addEventListener('click', () => navigate('modules'));

  MODULES.slice(0, 3).forEach(mod => {
    document.getElementById(`module-go-${mod.id}`)?.addEventListener('click', () => navigate('modules'));
  });

  // Pill tab switching — re-render just the tile grid
  document.querySelectorAll('.pill-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeHomeTab = btn.dataset.hometab;
      document.querySelectorAll('.pill-tab').forEach(b => b.classList.toggle('active', b === btn));
      const progress = getProgress();
      document.getElementById('home-tile-grid').innerHTML = buildTileGrid(activeHomeTab, progress);
      attachTileEvents(navigate);
    });
  });

  attachTileEvents(navigate);
}

function attachTileEvents(navigate) {
  document.querySelectorAll('[data-nav-screen]').forEach(el => {
    el.addEventListener('click', () => {
      const screen = el.dataset.navScreen;
      if (el.dataset.navLesson) { navigate('lesson', { lessonId: el.dataset.navLesson }); return; }
      const params = el.dataset.navParams ? JSON.parse(el.dataset.navParams) : {};
      navigate(screen, params);
    });
  });
}
