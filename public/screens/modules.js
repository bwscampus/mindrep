// screens/modules.js — Athletic module map

import { MODULES } from '../data/lessons.js';
import { getProgress, storage } from '../utils/storage.js';
import { isAdmin } from '../utils/admin.js';
import { showToast } from '../utils/gamification.js';
import { moduleIcon } from '../utils/illustrations.js';

// Modules no longer get a distinct rainbow color each — the design system
// uses one accent color (mint/teal) reserved for progress/active state, with
// everything else neutral. Module icons still differ by shape (see
// utils/illustrations.js), so modules stay visually distinguishable without
// color-coding. Completed modules render with the accent instead (see below).
const MODULE_STRIPE_COLORS = {
  1: '#8B93A3', 2: '#8B93A3', 3: '#8B93A3', 4: '#8B93A3',
  5: '#8B93A3', 6: '#8B93A3', 7: '#8B93A3',
};

export function renderModules(navigate) {
  const progress     = getProgress();
  const completed    = progress.completedLessons || [];
  const completedMods = progress.completedModules || [];
  const admin        = isAdmin();

  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);
  const totalDone    = completed.length;
  const overallPct   = Math.round((totalDone / totalLessons) * 100);

  return `
    <div class="screen" style="padding-top:24px">
      <h1 style="font-family:var(--font-display);font-size:2rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Your Journey</h1>
      <p style="color:var(--muted2);font-size:.87rem;margin-bottom:20px;font-family:var(--font-body)">7 modules · 21+ lessons · 30 days to a better mindset.</p>

      <!-- Overall progress -->
      <div class="glass" style="padding:18px 20px;margin-bottom:22px;display:flex;align-items:center;gap:16px;border-color:rgba(94,234,212,.15);background:linear-gradient(135deg,rgba(94,234,212,.07),rgba(168,175,189,.04))">
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Overall Progress</div>
          <div class="xp-bar-wrap">
            <div class="xp-bar" style="width:${overallPct}%"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--font-display);font-size:2rem;font-weight:900;color:var(--teal);line-height:1">${overallPct}%</div>
          <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">${totalDone}/${totalLessons}</div>
        </div>
      </div>

      ${MODULES.map((mod) => {
        const modLessons   = mod.lessons;
        const modCompleted = modLessons.filter(l => completed.includes(l.id)).length;
        const modPct       = Math.round((modCompleted / modLessons.length) * 100);
        const isModComplete = completedMods.includes(mod.id) || modCompleted === modLessons.length;
        const isLocked     = admin ? false : mod.locked;
        // Neutral gray by default; the single accent color is reserved for
        // a module that's actually in progress or done.
        const stripeColor  = isModComplete ? '#5EEAD4' : modCompleted > 0 ? 'var(--teal)' : (MODULE_STRIPE_COLORS[mod.id] || mod.color);

        return `
          <div class="module-card glass ${isLocked ? 'locked' : ''}"
            style="border-left:4px solid ${isLocked ? 'var(--muted)' : stripeColor};padding:20px;margin-bottom:12px${isLocked ? ';cursor:default' : ''}"
            ${!isLocked ? `id="mod-${mod.id}"` : ''}>

            <!-- Watermark number -->
            <div class="module-watermark">${mod.id}</div>

            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
              <div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0">
                <div style="width:40px;height:40px;border-radius:10px;background:${isLocked ? 'rgba(255,255,255,0.06)' : stripeColor + '18'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  ${moduleIcon(mod.id, isLocked ? 'var(--muted)' : stripeColor, 22)}
                </div>
                <div style="min-width:0">
                  <div class="module-num">${mod.emoji} Module ${mod.id} &nbsp;·&nbsp; ${mod.lessons.length} lessons</div>
                  <div class="module-title">${mod.title}</div>
                </div>
              </div>
              ${isModComplete
                ? `<div style="font-size:1.5rem;flex-shrink:0;margin-left:8px">✅</div>`
                : isLocked
                  ? `<div style="font-size:1.2rem;opacity:.3;flex-shrink:0;margin-left:8px">🔒</div>`
                  : `<div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${stripeColor};background:${stripeColor}22;border-radius:4px;padding:4px 10px;flex-shrink:0;margin-left:8px;margin-top:2px">${modCompleted === 0 ? 'Not Started' : 'In Progress'}</div>`
              }
            </div>

            <div style="font-size:.83rem;color:var(--muted2);margin-bottom:12px;font-family:var(--font-body);line-height:1.5">${mod.description}</div>

            <!-- Progress bar -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:${!isLocked ? '14px' : '0'}">
              <div class="xp-bar-wrap" style="flex:1">
                <div class="xp-bar" style="width:${modPct}%;background:linear-gradient(90deg,${stripeColor},${stripeColor}88);box-shadow:0 0 8px ${stripeColor}55"></div>
              </div>
              <div style="font-family:var(--font-display);font-size:.72rem;font-weight:700;color:${stripeColor};flex-shrink:0">${modCompleted}/${modLessons.length}</div>
            </div>

            <!-- Lessons list -->
            ${!isLocked ? `
              <div style="display:flex;flex-direction:column;gap:6px">
                ${modLessons.map(lesson => {
                  const lDone = completed.includes(lesson.id);
                  return `
                    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;
                      background:${lDone ? 'rgba(94,234,212,0.08)' : 'rgba(255,255,255,0.03)'};
                      border:1px solid ${lDone ? 'rgba(94,234,212,0.25)' : 'var(--border)'};
                      cursor:pointer;transition:all .15s"
                      id="lesson-go-${lesson.id.replace('.', '-')}">
                      <div style="font-size:.95rem;flex-shrink:0">${lDone ? '✅' : '⭕'}</div>
                      <div style="flex:1;min-width:0">
                        <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem;letter-spacing:.02em;text-transform:uppercase">Lesson ${lesson.id}: ${lesson.title}</div>
                        <div style="font-size:.7rem;color:var(--muted2);margin-top:1px;font-family:var(--font-body)">⏱ ${lesson.duration} min &nbsp;·&nbsp; <span style="color:var(--lime);font-weight:700">+${lesson.xp} XP</span></div>
                      </div>
                      <div style="color:var(--muted);font-size:.8rem;flex-shrink:0">${lDone ? '✓' : '▶'}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="text-align:center;padding:10px 0;color:var(--muted);font-size:.82rem;font-family:var(--font-body)">
                🔒 Unlocks with MindRep+
              </div>
            `}
          </div>
        `;
      }).join('')}

      <!-- Premium / Admin CTA -->
      ${admin ? `
        <div class="glass" style="padding:20px 24px;text-align:center;margin-top:4px;border-color:rgba(94,234,212,.3);background:linear-gradient(135deg,rgba(94,234,212,.08),rgba(168,175,189,.05))">
          <div style="font-size:1.5rem;margin-bottom:8px">⚡</div>
          <div style="font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--teal);margin-bottom:4px">Demo Mode Active</div>
          <div style="font-size:.8rem;color:var(--muted);font-family:var(--font-body)">All 7 modules & features unlocked</div>
        </div>
      ` : `
        <div class="glass" style="padding:28px 24px;text-align:center;margin-top:4px;border-color:rgba(168,175,189,.2);background:linear-gradient(135deg,rgba(168,175,189,.07),rgba(168,175,189,.05))">
          <div style="font-size:2.5rem;margin-bottom:12px">👑</div>
          <h3 style="font-family:var(--font-display);font-size:1.4rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Unlock All 7 Modules</h3>
          <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;line-height:1.5;font-family:var(--font-body)">Get the complete 30-day mental training system + AI Coach + unlimited tracking.</p>
          <button class="btn btn-gold btn-block" id="upgrade-premium-btn">Upgrade to Premium 🏆</button>
        </div>
      `}

      <div style="height:16px"></div>
    </div>
  `;
}

export function attachModulesEvents(navigate) {
  const admin = isAdmin();
  MODULES.forEach(mod => {
    if (!admin && mod.locked) return;
    mod.lessons.forEach(lesson => {
      const id = `lesson-go-${lesson.id.replace('.', '-')}`;
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('mouseenter', () => {
          el.style.borderColor = 'rgba(94,234,212,0.35)';
          el.style.background = 'rgba(94,234,212,0.05)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.borderColor = '';
          el.style.background = '';
        });
        el.addEventListener('click', () => navigate('lesson', { lessonId: lesson.id }));
      }
    });
  });

  document.getElementById('upgrade-premium-btn')?.addEventListener('click', showPremiumWaitlist);
}

function showPremiumWaitlist() {
  const alreadyJoined = storage.get('waitlist_email', null);

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:rgba(0,0,0,0.6);
    display:flex;align-items:flex-end;
    backdrop-filter:blur(4px);
    animation:fadeIn .2s ease;
  `;

  overlay.innerHTML = alreadyJoined ? `
    <div style="background:var(--bg2);border:1px solid var(--border-bright);border-top-left-radius:16px;border-top-right-radius:16px;padding:28px 24px;width:100%;max-width:430px;margin:0 auto;animation:fadeUp .3s ease;text-align:center">
      <div style="font-size:2.5rem;margin-bottom:10px">👑</div>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">You're on the list!</div>
      <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;font-family:var(--font-body);line-height:1.5">We'll email <strong>${alreadyJoined}</strong> the moment MindRep+ launches.</p>
      <button id="waitlist-close" class="btn btn-primary btn-block">Got it</button>
    </div>
  ` : `
    <div style="background:var(--bg2);border:1px solid var(--border-bright);border-top-left-radius:16px;border-top-right-radius:16px;padding:28px 24px;width:100%;max-width:430px;margin:0 auto;animation:fadeUp .3s ease">
      <div style="font-size:2rem;margin-bottom:10px">👑</div>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">MindRep+ isn't live yet</div>
      <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;font-family:var(--font-body);line-height:1.5">
        Modules 4–7, the AI Coach, and full season tracking are still in development. Drop your email and we'll notify you the moment it's ready.
      </p>
      <input type="email" id="waitlist-email" placeholder="you@email.com"
        style="width:100%;background:rgba(255,255,255,.04);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;color:var(--text);font-size:.9rem;margin-bottom:12px"/>
      <div style="display:flex;gap:10px">
        <button id="waitlist-join" class="btn btn-gold" style="flex:1;font-size:.85rem">Join Waitlist ✓</button>
        <button id="waitlist-cancel" class="btn btn-secondary" style="flex:.5;font-size:.85rem">Not now</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('waitlist-close')?.addEventListener('click', () => overlay.remove());
  document.getElementById('waitlist-cancel')?.addEventListener('click', () => overlay.remove());
  document.getElementById('waitlist-join')?.addEventListener('click', () => {
    const input = document.getElementById('waitlist-email');
    const email = input?.value.trim();
    if (!email || !email.includes('@')) {
      showToast('Enter a valid email', '📧');
      return;
    }
    storage.set('waitlist_email', email);
    overlay.remove();
    showToast('You\'re on the MindRep+ waitlist! 👑', '✅');
  });
}
