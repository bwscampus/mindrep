// screens/achievements.js — Profile, stats, badges, share card

import { BADGES } from '../data/lessons.js';
import { storage, getProgress, saveProgress, getUser, getXPForLevel, LEVEL_NAMES } from '../utils/storage.js';
import { escapeHtml } from '../utils/escape.js';
// Demo mode was removed from this screen: the passphrase that unlocked it shipped
// in this public repo (Production Standard FE-2), so it is burned. The `admin`
// flag below is pinned false. Re-spec it with server-side enforcement when the
// paid tier is built — see ROADMAP.md.
import { showToast, fireConfetti } from '../utils/gamification.js';
import { drawMindGlyph } from '../utils/illustrations.js';
import { isLockedIn } from '../utils/lockedIn.js';

export function renderAchievements(navigate) {
  const progress    = getProgress();
  const user        = getUser();
  const admin       = false;
  const xp          = admin ? 9999 : (progress.xp || 0);
  const level       = admin ? 10   : (progress.level || 1);
  const levelInfo   = getXPForLevel(level);
  const xpRange     = levelInfo.next - levelInfo.current;
  const xpPct       = xpRange > 0 ? Math.min(100, ((xp - levelInfo.current) / xpRange) * 100) : 100;
  const earnedBadges = admin ? BADGES.map(b => b.id) : (progress.badges || []);
  const streak      = admin ? Math.max(progress.streak || 0, 30) : (progress.streak || 0);
  const completed   = admin ? 21 : (progress.completedLessons || []).length;
  const gamesLogged = (progress.gameLog || []).length;

  const svgSize = 120, r = 50, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const dashOffset    = circumference * (1 - xpPct / 100);

  // Top badge (for share card)
  const topBadge = BADGES.find(b => earnedBadges.includes(b.id)) || null;

  return `
    <div class="screen" style="padding-top:24px">
      <!-- Profile header -->
      <div class="achievements-header glass" style="padding:28px 24px">
        ${admin ? `<div style="font-family:var(--font-display);font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin-bottom:8px">⚡ Demo Mode Active</div>` : ''}
        <div class="level-ring-wrap">
          <svg class="progress-ring" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
            <circle class="progress-ring-track" cx="${cx}" cy="${cy}" r="${r}"/>
            <circle class="progress-ring-fill" cx="${cx}" cy="${cy}" r="${r}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
              stroke="url(#grad1)"/>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#8FF5D0"/>
                <stop offset="100%" style="stop-color:#5EEAD4"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="level-badge">
            <span class="lv-num">${level}</span>
            <span class="lv-label">Level</span>
          </div>
        </div>
        <h1 style="font-family:var(--font-display);font-size:1.8rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">${escapeHtml(user?.name || 'Athlete')}</h1>
        <div style="color:var(--gold);font-family:var(--font-display);font-weight:700;font-size:1rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">${levelInfo.label}</div>
        <div style="font-size:.8rem;color:var(--muted);margin-bottom:8px;font-family:var(--font-body)">${xp} / ${levelInfo.next} XP to Level ${level + 1}</div>
        <div class="xp-bar-wrap">
          <div class="xp-bar" style="width:${xpPct}%"></div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid-2 mt-16 mb-16" style="gap:10px">
        <!-- Streak -->
        <div class="stat-card glass" style="padding:18px;border-top:2px solid var(--lime)">
          ${streak === 0 ? `
            <div style="font-size:2rem;margin-bottom:6px">🔥</div>
            <div class="stat-label">Day Streak</div>
            <div style="font-size:.75rem;color:var(--muted2);margin-top:6px;font-family:var(--font-body);line-height:1.4">Complete today's lesson to start your streak.</div>
            <button class="btn btn-lime btn-sm btn-block mt-8" id="stat-start-streak" style="font-size:.7rem">Start Now →</button>
          ` : `
            <div class="stat-value" style="color:var(--lime)">${streak}</div>
            <div class="stat-label">Day Streak</div>
          `}
        </div>
        <!-- Lessons -->
        <div class="stat-card glass" style="padding:18px;border-top:2px solid var(--teal)">
          ${completed === 0 ? `
            <div style="font-size:2rem;margin-bottom:6px">📚</div>
            <div class="stat-label">Lessons Done</div>
            <div style="font-size:.75rem;color:var(--muted2);margin-top:6px;font-family:var(--font-body);line-height:1.4">Your first lesson takes 5 min — let's go.</div>
            <button class="btn btn-primary btn-sm btn-block mt-8" id="stat-start-lesson" style="font-size:.7rem">Go →</button>
          ` : `
            <div class="stat-value text-teal">${completed}</div>
            <div class="stat-label">Lessons Done</div>
          `}
        </div>
        <!-- Games -->
        <div class="stat-card glass" style="padding:18px;border-top:2px solid var(--orange)">
          ${gamesLogged === 0 ? `
            <div style="font-size:2rem;margin-bottom:6px">📋</div>
            <div class="stat-label">Games Logged</div>
            <div style="font-size:.75rem;color:var(--muted2);margin-top:6px;font-family:var(--font-body);line-height:1.4">Log your next game after it happens.</div>
            <button class="btn btn-secondary btn-sm btn-block mt-8" id="stat-start-log" style="font-size:.7rem">Log Game →</button>
          ` : `
            <div class="stat-value" style="color:var(--orange)">${gamesLogged}</div>
            <div class="stat-label">Games Logged</div>
          `}
        </div>
        <!-- Badges -->
        <div class="stat-card glass" style="padding:18px;border-top:2px solid var(--gold)">
          ${earnedBadges.length === 0 ? `
            <div style="font-size:2rem;margin-bottom:6px">🏅</div>
            <div class="stat-label">Badges</div>
            <div style="font-size:.75rem;color:var(--muted2);margin-top:6px;font-family:var(--font-body);line-height:1.4">Complete a lesson to earn your first badge.</div>
          ` : `
            <div class="stat-value" style="color:var(--gold)">${earnedBadges.length}</div>
            <div class="stat-label">Badges</div>
          `}
        </div>
      </div>

      <!-- Share button -->
      <button class="btn btn-secondary btn-block mb-16" id="share-progress-btn" style="border-color:rgba(94,234,212,.3);color:var(--teal)">
        📤 Share My Progress
      </button>

      ${isLockedIn(progress) ? renderToolbox(progress) : ''}

      <!-- Badges grid -->
      <div class="section-heading">🏅 Achievements</div>
      ${earnedBadges.length === 0 ? `
        <div class="glass" style="padding:24px;text-align:center;margin-bottom:16px">
          <div style="font-family:var(--font-display);font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:16px">Locked Badges — Complete Lessons to Earn</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px">
            ${BADGES.slice(0, 9).map(badge => `
              <div class="badge-card glass locked-badge" style="padding:14px 8px;border-radius:8px">
                <span class="be" style="filter:grayscale(1) opacity(.25)">${badge.icon}</span>
                <div class="bn">${badge.name}</div>
                <div class="bd">🔒 Locked</div>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-sm" id="badges-go-lesson">Start Earning →</button>
        </div>
      ` : `
        <div class="badges-grid mb-16">
          ${BADGES.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            return `
              <div class="badge-card glass ${isEarned ? 'earned' : 'locked-badge'}">
                <span class="be">${badge.icon}</span>
                <div class="bn">${badge.name}</div>
                <div class="bd">${isEarned ? badge.desc : '🔒 Locked'}</div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Level roadmap -->
      <div class="section-heading mt-20">🗺️ Level Roadmap</div>
      <div class="glass" style="padding:20px;margin-bottom:16px">
        ${LEVEL_NAMES.slice(1).map((name, i) => {
          const lv = i + 1;
          const thresholds = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000];
          const xpNeeded   = thresholds[i] || 0;
          const isReached  = xp >= xpNeeded;
          const isCurrent  = level === lv;
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);opacity:${isReached ? '1' : '.4'}">
              <div style="width:32px;height:32px;border-radius:50%;
                background:${isCurrent ? 'linear-gradient(135deg,var(--teal),var(--purple))' : isReached ? 'rgba(94,234,212,.2)' : 'var(--card)'};
                border:2px solid ${isCurrent ? 'var(--teal)' : isReached ? 'var(--teal)' : 'var(--border)'};
                display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:.85rem;flex-shrink:0">
                ${isReached ? (isCurrent ? lv : '✓') : lv}
              </div>
              <div style="flex:1">
                <div style="font-family:var(--font-display);font-weight:700;font-size:.95rem;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(name)}</div>
                <div style="font-size:.7rem;color:var(--muted);font-family:var(--font-body)">${xpNeeded} XP</div>
              </div>
              ${isCurrent ? `<div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;color:var(--teal);letter-spacing:.1em;text-transform:uppercase">You Are Here</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Notification preference toggle -->
      <div class="glass" style="padding:18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem;text-transform:uppercase;letter-spacing:.06em">Pre-Game Reminders</div>
          <div style="font-size:.75rem;color:var(--muted2);margin-top:2px;font-family:var(--font-body)">In-app banner when a game is coming up</div>
        </div>
        <label style="position:relative;width:46px;height:26px;flex-shrink:0">
          <input type="checkbox" id="reminder-toggle" style="opacity:0;width:0;height:0" ${localStorage.getItem('mindrep_reminders') === 'true' ? 'checked' : ''}>
          <span id="reminder-track" style="position:absolute;inset:0;border-radius:50px;cursor:pointer;transition:background .2s;background:${localStorage.getItem('mindrep_reminders') === 'true' ? 'var(--teal)' : 'rgba(255,255,255,0.12)'}"></span>
          <span id="reminder-thumb" style="position:absolute;top:3px;left:${localStorage.getItem('mindrep_reminders') === 'true' ? '22px' : '3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>
        </label>
      </div>


      <!-- FE-7: progress lives in this browser, so clearing it has to be
           possible from the UI — otherwise the next person on a shared device
           inherits the previous athlete's journal. -->
      <button class="btn btn-secondary btn-sm" id="reset-progress" style="opacity:.6;margin-bottom:8px;width:100%">🗑 Erase my data from this device</button>
      <div style="height:16px"></div>
    </div>

    <!-- Hidden canvas for share card -->
    <canvas id="share-canvas" width="600" height="400" style="display:none"></canvas>
  `;
}

// My Toolbox — the mental tools an athlete builds during Foundations
// (neutral phrase, reset routine, control list) used to only exist as a
// one-time journal entry buried inside a specific lesson. This surfaces
// them as a real, persistent, editable part of their profile.
function renderToolbox(progress) {
  return `
    <div class="section-heading">🧰 My Toolbox</div>
    <div class="glass" style="padding:20px;margin-bottom:16px">
      <div style="font-size:.8rem;color:var(--muted2);margin-bottom:16px;font-family:var(--font-body);line-height:1.5">
        The mental tools you built in Foundations — yours to revisit and update anytime.
      </div>
      <div style="margin-bottom:14px">
        <div class="reflection-question" style="text-transform:none;letter-spacing:0;font-size:.8rem">Neutral Reset Phrase</div>
        <input class="reflection-textarea" id="toolbox-neutralPhrase" type="text" placeholder="e.g. Next play." value="${escapeHtml(progress.neutralPhrase || '')}"
          style="height:auto;min-height:0;padding:12px 14px" />
      </div>
      <div style="margin-bottom:14px">
        <div class="reflection-question" style="text-transform:none;letter-spacing:0;font-size:.8rem">Reset Routine</div>
        <input class="reflection-textarea" id="toolbox-resetRoutine" type="text" placeholder="Not set yet — try Lesson 1.3" value="${escapeHtml(progress.resetRoutine || '')}"
          style="height:auto;min-height:0;padding:12px 14px" />
      </div>
      <div style="margin-bottom:16px">
        <div class="reflection-question" style="text-transform:none;letter-spacing:0;font-size:.8rem">Circle of Control</div>
        <textarea class="reflection-textarea" id="toolbox-controlList" placeholder="Not set yet — try Lesson 3.1" rows="2">${escapeHtml(progress.controlList || '')}</textarea>
      </div>
      <button class="btn btn-primary btn-sm btn-block" id="toolbox-save">Save Toolbox</button>
    </div>
  `;
}

export function attachAchievementsEvents(navigate) {
  document.getElementById('toolbox-save')?.addEventListener('click', () => {
    const progress = getProgress();
    progress.neutralPhrase = document.getElementById('toolbox-neutralPhrase')?.value.trim() || null;
    progress.resetRoutine  = document.getElementById('toolbox-resetRoutine')?.value.trim() || null;
    progress.controlList   = document.getElementById('toolbox-controlList')?.value.trim() || null;
    saveProgress(progress);
    showToast('Toolbox saved ✓', '🧰');
  });

  // Empty state CTAs
  document.getElementById('stat-start-streak')?.addEventListener('click', () => navigate('home'));
  document.getElementById('stat-start-lesson')?.addEventListener('click', () => navigate('home'));
  document.getElementById('stat-start-log')?.addEventListener('click', ()    => navigate('tracker', { tab: 'journal' }));
  document.getElementById('badges-go-lesson')?.addEventListener('click', ()  => navigate('home'));

  // Reminder toggle
  document.getElementById('reminder-toggle')?.addEventListener('change', (e) => {
    const on = e.target.checked;
    localStorage.setItem('mindrep_reminders', on ? 'true' : 'false');
    const track = document.getElementById('reminder-track');
    const thumb = document.getElementById('reminder-thumb');
    if (track) track.style.background = on ? 'var(--teal)' : 'rgba(255,255,255,0.12)';
    if (thumb) thumb.style.left = on ? '22px' : '3px';
    showToast(on ? 'Reminders enabled ✓' : 'Reminders off', on ? '🔔' : '🔕', 2000);
    if (on) Notification.requestPermission?.();
  });

  // Share progress
  document.getElementById('share-progress-btn')?.addEventListener('click', () => generateShareCard(navigate));

  // Reset
  document.getElementById('reset-progress')?.addEventListener('click', () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      storage.clear(); location.reload();
    }
  });

}

function generateShareCard(navigate) {
  const canvas  = document.getElementById('share-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const W = 600, H = 400;

  const user     = getUser();
  const progress = getProgress();
  const earnedBadges = progress.badges || [];
  const level    = progress.level || 1;
  const levelInfo = getXPForLevel(level);
  const streak   = progress.streak || 0;
  const topBadge = BADGES.find(b => earnedBadges.includes(b.id));

  // Background
  ctx.fillStyle = '#14171D';
  ctx.fillRect(0, 0, W, H);

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, 'rgba(94,234,212,0.08)');
  grad.addColorStop(1, 'rgba(168,175,189,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Left mint/teal stripe
  ctx.fillStyle = '#5EEAD4';
  ctx.fillRect(0, 0, 4, H);

  // MindRep logo text (top-left)
  ctx.font = 'bold 900 28px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#5EEAD4';
  ctx.textBaseline = 'top';
  ctx.fillText('MINDREP', 24, 22);

  // Illustrated mind/lightning flourish (replaces the old plain "M" watermark)
  drawMindGlyph(ctx, W - 90, H / 2, 170, { glowOpacity: 0.05, strokeOpacity: 0.05, boltColor: 'rgba(94,234,212,0.06)' });

  // User name
  ctx.font = '900 48px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#F1F5F9';
  ctx.textBaseline = 'top';
  ctx.fillText((user?.name || 'ATHLETE').toUpperCase(), 24, 72);

  // Level label
  ctx.font = '700 20px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#A8AFBD';
  ctx.fillText(`${levelInfo.label.toUpperCase()} · LEVEL ${level}`, 24, 130);

  // Streak
  ctx.font = '900 72px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#5EEAD4';
  ctx.fillText(`🔥 ${streak}`, 24, 170);

  ctx.font = '700 18px "Barlow Condensed", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('DAY STREAK', 24, 255);

  // Top badge
  if (topBadge) {
    ctx.font = '60px serif';
    ctx.fillText(topBadge.icon, 340, 165);
    ctx.font = '700 20px "Barlow Condensed", sans-serif';
    ctx.fillStyle = '#F1F5F9';
    ctx.fillText(topBadge.name.toUpperCase(), 340, 238);
    ctx.font = '400 14px "Barlow Condensed", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(topBadge.desc, 340, 262);
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(94,234,212,0.12)';
  ctx.fillRect(0, H - 52, W, 52);
  ctx.fillStyle = '#5EEAD4';
  ctx.font = '700 16px "Barlow Condensed", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('Building my mental game with MindRep', 24, H - 26);

  // Try native share, fallback to download
  canvas.toBlob(blob => {
    if (!blob) { showToast('Could not generate card', '❌'); return; }
    const file  = new File([blob], 'mindrep-progress.png', { type: 'image/png' });
    const url   = URL.createObjectURL(blob);

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({
        title: 'My MindRep Progress',
        text: `I'm building my mental game with MindRep! ${streak}-day streak and counting 🔥`,
        files: [file]
      }).catch(() => downloadCard(url));
    } else {
      downloadCard(url);
    }
  }, 'image/png');
}

function downloadCard(url) {
  const a = document.createElement('a');
  a.href = url; a.download = 'mindrep-progress.png'; a.click();
  URL.revokeObjectURL(url);
  showToast('Progress card downloaded! 📤', '✅');
}
