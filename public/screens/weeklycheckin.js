// screens/weeklycheckin.js — Weekly Check-in: a once-a-week pulse for
// athletes in "Locked In" mode. Distinct from the Tracker's per-game
// journal — this is cadence-based (once a week), not event-based.

import { getProgress, saveProgress, addXP } from '../utils/storage.js';
import { fireConfetti, showToast, floatXP, checkAndUnlockBadges } from '../utils/gamification.js';
import { getWeekKey, isWeeklyCheckinDue } from '../utils/weekly.js';

let navigateFn = null;
let ratings = { effort: 3, confidence: 3, consistency: 3 };

export function renderWeeklyCheckin(navigate) {
  navigateFn = navigate;
  ratings = { effort: 3, confidence: 3, consistency: 3 };

  const progress = getProgress();
  const app = document.getElementById('app');
  app.innerHTML = isWeeklyCheckinDue(progress) ? renderForm() : renderDone();
  attachEvents();
}

function renderDone() {
  return `
    <div class="screen text-center" style="padding-top:70px">
      <div style="font-size:3.5rem;margin-bottom:14px">🗓️</div>
      <h2 style="font-family:var(--font-ui);font-weight:700;font-size:1.4rem;margin-bottom:8px">Already Checked In</h2>
      <p style="color:var(--muted2);font-size:.9rem;margin-bottom:28px;line-height:1.5">You've done this week's check-in.<br>The next one unlocks Monday.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-secondary" id="wc-home">Back to Home</button>
        <button class="btn btn-primary" id="wc-history">View History</button>
      </div>
    </div>
  `;
}

function renderForm() {
  return `
    <div class="screen" style="padding-top:20px">
      <div class="lesson-header" style="margin-bottom:20px">
        <button class="lesson-back" id="wc-back">←</button>
        <div style="flex:1">
          <div style="font-family:var(--font-ui);font-size:.7rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)">🗓️ Weekly Check-In</div>
          <div style="font-family:var(--font-ui);font-weight:700;font-size:1.2rem;margin-top:2px">How was your week?</div>
        </div>
        <div style="font-family:var(--font-numeral);font-size:.9rem;font-weight:700;color:var(--teal)">+25 XP</div>
      </div>

      <div class="lesson-card glass" style="margin-bottom:16px">
        <div class="reflection-form">
          ${[
            { key: 'effort',      label: 'Effort this week' },
            { key: 'confidence',  label: 'Confidence this week' },
            { key: 'consistency', label: 'Consistency this week' }
          ].map(s => `
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div class="reflection-question" style="margin-bottom:0">${s.label}</div>
                <div style="font-family:var(--font-numeral);font-weight:700;color:var(--teal)" id="wc-val-${s.key}">3</div>
              </div>
              <div class="slider-wrap">
                <span style="font-size:.75rem;color:var(--muted)">1</span>
                <input type="range" min="1" max="5" value="3" id="wc-${s.key}" style="flex:1;accent-color:var(--teal)">
                <span style="font-size:.75rem;color:var(--muted)">5</span>
              </div>
            </div>
          `).join('')}
          <div>
            <div class="reflection-question">One win this week</div>
            <textarea class="reflection-textarea" id="wc-win" placeholder="Something that went well..." rows="2"></textarea>
          </div>
          <div>
            <div class="reflection-question">One focus for next week</div>
            <textarea class="reflection-textarea" id="wc-focus" placeholder="What you'll work on..." rows="2"></textarea>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="wc-submit">Submit Check-In ✓</button>
    </div>
  `;
}

function attachEvents() {
  document.getElementById('wc-home')?.addEventListener('click', () => navigateFn('home'));
  document.getElementById('wc-back')?.addEventListener('click', () => navigateFn('home'));
  document.getElementById('wc-history')?.addEventListener('click', () => navigateFn('tracker', { tab: 'weekly' }));

  ['effort', 'confidence', 'consistency'].forEach(key => {
    const el = document.getElementById(`wc-${key}`);
    const val = document.getElementById(`wc-val-${key}`);
    el?.addEventListener('input', () => {
      ratings[key] = parseInt(el.value);
      if (val) val.textContent = el.value;
    });
  });

  document.getElementById('wc-submit')?.addEventListener('click', () => {
    const progress = getProgress();
    progress.weeklyCheckins = progress.weeklyCheckins || [];
    progress.weeklyCheckins.push({
      weekKey: getWeekKey(),
      date: Date.now(),
      effort: ratings.effort,
      confidence: ratings.confidence,
      consistency: ratings.consistency,
      win: document.getElementById('wc-win')?.value.trim() || '',
      focus: document.getElementById('wc-focus')?.value.trim() || ''
    });

    addXP(progress, 25);
    const { progress: p2, earned } = checkAndUnlockBadges(progress);
    saveProgress(p2);
    fireConfetti();
    floatXP(25, document.getElementById('wc-submit'));
    showToast('Weekly Check-In complete! 🗓️', '✅');
    earned.forEach((b, i) => {
      setTimeout(() => showToast(`Badge: ${b.name}!`, b.icon, 3000), 600 + i * 900);
    });
    setTimeout(() => renderWeeklyCheckin(navigateFn), 500);
  });
}
