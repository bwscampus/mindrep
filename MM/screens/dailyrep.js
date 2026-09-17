// screens/dailyrep.js — Daily Mental Rep: the "Locked In" mode habit loop.
// A single 60-90s exercise, reusing the same visual language as the lesson
// player (lesson-card, swipe-card, reflection-textarea) without any of its
// multi-section machinery — this is one screen, not a five-step flow.

import { getTodayRep } from '../data/dailyReps.js';
import { getProgress, saveProgress, addXP } from '../utils/storage.js';
import { fireConfetti, showToast, floatXP, checkAndUnlockBadges } from '../utils/gamification.js';

let navigateFn = null;
let flipped = false;

export function renderDailyRep(navigate) {
  navigateFn = navigate;
  flipped = false;

  const progress = getProgress();
  const rep = getTodayRep();
  const todayKey = new Date().toDateString();
  const doneToday = !!(progress.dailyReps || {})[todayKey];

  const app = document.getElementById('app');
  app.innerHTML = doneToday ? renderDone() : renderRep(rep);
  attachEvents(rep, doneToday);
}

function renderDone() {
  return `
    <div class="screen text-center" style="padding-top:70px">
      <div style="font-size:3.5rem;margin-bottom:14px">✅</div>
      <h2 style="font-family:var(--font-ui);font-weight:700;font-size:1.4rem;margin-bottom:8px">Rep Complete</h2>
      <p style="color:var(--muted2);font-size:.9rem;margin-bottom:28px;line-height:1.5">You already did today's rep — nice work.<br>Come back tomorrow for a new one.</p>
      <button class="btn btn-primary" id="rep-home">Back to Home</button>
    </div>
  `;
}

function renderRep(rep) {
  return `
    <div class="screen" style="padding-top:20px">
      <div class="lesson-header" style="margin-bottom:20px">
        <button class="lesson-back" id="rep-back">←</button>
        <div style="flex:1">
          <div style="font-family:var(--font-ui);font-size:.7rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)">🎯 Daily Rep · ${rep.skill}</div>
          <div style="font-family:var(--font-ui);font-weight:700;font-size:1.2rem;margin-top:2px">${rep.title}</div>
        </div>
        <div style="font-family:var(--font-numeral);font-size:.9rem;font-weight:700;color:var(--teal)">+15 XP</div>
      </div>

      ${rep.type === 'flip' ? renderFlip(rep) : rep.type === 'breathe' ? renderBreatheRep(rep) : renderPrompt(rep)}
    </div>
  `;
}

function renderFlip(rep) {
  return `
    <div class="lesson-card glass" style="margin-bottom:16px">
      <p style="color:var(--muted2);font-size:.85rem;margin-bottom:16px">Tap the card to flip the thought.</p>
      <div class="swipe-card glass" id="rep-swipe">
        <div style="font-weight:700;color:var(--coral);margin-bottom:4px" id="rep-swipe-text">${rep.negative}</div>
        <div style="font-size:.75rem;color:var(--muted)" id="rep-swipe-hint">Tap to flip →</div>
      </div>
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="rep-complete" style="opacity:.5" disabled>Flip the card first</button>
  `;
}

function renderPrompt(rep) {
  return `
    <div class="lesson-card glass" style="margin-bottom:16px">
      <p style="font-size:.95rem;line-height:1.7;color:rgba(241,245,249,.85);margin-bottom:16px">${rep.prompt}</p>
      <textarea class="reflection-textarea" id="rep-input" placeholder="Type your answer..." rows="3"></textarea>
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="rep-complete">Complete Rep ✓</button>
  `;
}

function renderBreatheRep(rep) {
  return `
    <div class="lesson-card glass text-center" style="margin-bottom:16px;padding:32px 22px">
      <div style="font-size:2.4rem;margin-bottom:14px">💨</div>
      <p style="font-size:.95rem;line-height:1.7;color:rgba(241,245,249,.85);margin-bottom:8px">${rep.prompt}</p>
      <p style="font-size:.78rem;color:var(--muted)">Use the Breathe tool in Practice, then mark this done.</p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary btn-sm" style="flex:1;font-size:.8rem" id="rep-go-breathe">Open Breathe</button>
      <button class="btn btn-primary btn-sm" style="flex:1;font-size:.8rem" id="rep-complete">Done ✓</button>
    </div>
  `;
}

function attachEvents(rep, doneToday) {
  document.getElementById('rep-home')?.addEventListener('click', () => navigateFn('home'));
  document.getElementById('rep-back')?.addEventListener('click', () => navigateFn('home'));
  document.getElementById('rep-go-breathe')?.addEventListener('click', () => navigateFn('practice', { tab: 'breathe' }));

  if (doneToday) return;

  document.getElementById('rep-swipe')?.addEventListener('click', () => {
    flipped = true;
    const textEl = document.getElementById('rep-swipe-text');
    const hintEl = document.getElementById('rep-swipe-hint');
    if (textEl) { textEl.textContent = rep.neutral; textEl.style.color = 'var(--teal)'; }
    if (hintEl) hintEl.textContent = '✅ Neutral!';
    document.getElementById('rep-swipe')?.classList.add('swiped-good');
    const btn = document.getElementById('rep-complete');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.textContent = 'Complete Rep ✓'; }
  });

  document.getElementById('rep-complete')?.addEventListener('click', () => {
    if (rep.type === 'flip' && !flipped) return;

    const progress = getProgress();
    progress.dailyReps = progress.dailyReps || {};
    progress.dailyReps[new Date().toDateString()] = true;

    if (rep.type === 'prompt') {
      const input = document.getElementById('rep-input');
      if (input?.value.trim()) {
        progress.journalEntries = progress.journalEntries || [];
        progress.journalEntries.push({ date: Date.now(), lessonId: 'daily-rep', text: input.value.trim() });
      }
    }

    addXP(progress, 15);
    const { progress: p2, earned } = checkAndUnlockBadges(progress);
    saveProgress(p2);
    fireConfetti();
    floatXP(15, document.getElementById('rep-complete'));
    showToast('Daily Rep complete! 🎯', '✅');
    earned.forEach((b, i) => {
      setTimeout(() => showToast(`Badge: ${b.name}!`, b.icon, 3000), 600 + i * 900);
    });
    setTimeout(() => renderDailyRep(navigateFn), 500);
  });
}
