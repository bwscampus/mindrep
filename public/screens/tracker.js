// screens/tracker.js — Season Tracker: log, history, SVG trend charts

import { getProgress, saveProgress, getUser } from '../utils/storage.js';
import { showToast, fireConfetti } from '../utils/gamification.js';
import { getSportTerms } from '../utils/sports.js';
import { isLockedIn } from '../utils/lockedIn.js';
import { isWeeklyCheckinDue } from '../utils/weekly.js';

let activeTab = 'journal';

export function renderTracker(navigate, params = {}) {
  activeTab = params.tab || 'journal';
  const progress = getProgress();
  return buildTrackerHTML(progress, navigate);
}

function buildTrackerHTML(progress, navigate) {
  const user      = getUser();
  const sportTerms = getSportTerms(user?.sport);
  const lockedIn  = isLockedIn(progress);
  const tabs = [
    { id: 'journal', label: '📝 Log' },
    { id: 'history', label: '📋 History' },
    { id: 'trends',  label: '📈 Trends' },
    ...(lockedIn ? [{ id: 'weekly', label: '🗓️ Weekly' }] : [])
  ];
  // Defensive fallback if 'weekly' is somehow active without being Locked In
  const tab = (activeTab === 'weekly' && !lockedIn) ? 'journal' : activeTab;

  return `
    <div class="screen" style="padding-top:24px">
      <h1 style="font-family:var(--font-display);font-size:2rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Season Tracker</h1>
      <p style="color:var(--muted2);font-size:.85rem;margin-bottom:20px;font-family:var(--font-body)">Track your mental performance every ${sportTerms.event.toLowerCase()}.</p>

      <div class="tab-bar">
        ${tabs.map(t => `
          <button class="tab-btn ${tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>
        `).join('')}
      </div>

      <div id="tracker-content">
        ${tab === 'journal' ? renderJournalTab(progress, sportTerms) :
          tab === 'history' ? renderHistoryTab(progress, sportTerms, navigate) :
          tab === 'weekly'  ? renderWeeklyTab(progress, navigate) :
          renderTrendsTab(progress, sportTerms, navigate)}
      </div>
    </div>
  `;
}

function renderJournalTab(progress, sportTerms) {
  return `
    <div class="glass" style="padding:24px;margin-bottom:16px">
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:18px">📝 Log a ${sportTerms.event}</div>
      <div class="reflection-form">

        <!-- Type buttons -->
        <div>
          <div class="reflection-question">Session Type</div>
          <div style="display:flex;gap:8px">
            <button class="entry-type-btn btn btn-secondary btn-sm" data-type="game"     style="flex:1">${sportTerms.emoji} ${sportTerms.event}</button>
            <button class="entry-type-btn btn btn-secondary btn-sm" data-type="practice" style="flex:1">🏋️ Practice</button>
            <button class="entry-type-btn btn btn-secondary btn-sm" data-type="other"    style="flex:1">📌 Other</button>
          </div>
        </div>

        <!-- Game date (for reminders) -->
        <div>
          <div class="reflection-question">Date</div>
          <input type="date" id="game-date" value="${new Date().toISOString().split('T')[0]}"
            style="width:100%;background:rgba(255,255,255,.04);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;color:var(--text);font-size:.9rem;transition:border-color .2s"
          />
        </div>

        <!-- Performance -->
        <div>
          <div class="reflection-question">Overall Performance (1–10)</div>
          <div class="slider-wrap">
            <span style="font-size:.75rem;color:var(--muted)">1</span>
            <input type="range" min="1" max="10" value="7" id="perf-slider" style="flex:1;accent-color:var(--teal)">
            <span style="font-family:var(--font-display);font-weight:900;font-size:1.1rem;color:var(--teal);min-width:22px;text-align:right" id="perf-val">7</span>
          </div>
        </div>

        <!-- Mental focus -->
        <div>
          <div class="reflection-question">Mental Focus During</div>
          <div style="display:flex;gap:8px;justify-content:center">
            ${['😤','😕','😐','😊','🔥'].map((e, i) => `
              <button class="mental-btn" data-val="${i+1}"
                style="font-size:1.6rem;background:none;border:2px solid var(--border);border-radius:8px;padding:8px;cursor:pointer;transition:all .15s;flex:1">
                ${e}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Pre-game confidence -->
        <div>
          <div class="reflection-question">Pre-Game Confidence (1–5)</div>
          <div class="slider-wrap">
            <span style="font-size:.75rem;color:var(--muted)">1</span>
            <input type="range" min="1" max="5" value="3" id="conf-slider" style="flex:1;accent-color:var(--purple)">
            <span style="font-family:var(--font-display);font-weight:900;font-size:1.1rem;color:var(--purple);min-width:22px;text-align:right" id="conf-val">3</span>
          </div>
        </div>

        <!-- Reflection questions -->
        <div>
          <div class="reflection-question">What went well mentally?</div>
          <textarea class="reflection-textarea" id="q-good" placeholder="e.g. I used my reset phrase after a ${sportTerms.miss}..." rows="2"></textarea>
        </div>
        <div>
          <div class="reflection-question">What did you control today?</div>
          <textarea class="reflection-textarea" id="q-control" placeholder="e.g. My effort, my attitude, my preparation..." rows="2"></textarea>
        </div>
        <div>
          <div class="reflection-question">One focus for next time:</div>
          <textarea class="reflection-textarea" id="q-next" placeholder="e.g. Remember to breathe before a ${sportTerms.miss}..." rows="2"></textarea>
        </div>

        <button class="btn btn-primary btn-block btn-lg" id="save-entry" style="text-transform:uppercase;letter-spacing:.08em">Save Entry ✓</button>
      </div>
    </div>
  `;
}

function renderHistoryTab(progress, sportTerms, navigate) {
  const gameLog = progress.gameLog || [];
  if (!gameLog.length) {
    return `
      <div class="glass text-center" style="padding:48px 24px">
        <div style="font-size:3.5rem;margin-bottom:16px">📝</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">No Entries Yet</h3>
        <p style="color:var(--muted2);font-size:.88rem;margin-bottom:20px;font-family:var(--font-body);line-height:1.5">Log your next ${sportTerms.event.toLowerCase()} after it happens to start building your mental performance record.</p>
        <button class="btn btn-primary" id="go-log">Log a ${sportTerms.event} →</button>
      </div>
    `;
  }

  const avgPerf = (gameLog.reduce((s,e) => s + (e.performance||0), 0) / gameLog.length).toFixed(1);
  const avgConf = (gameLog.reduce((s,e) => s + (e.confidence||0), 0) / gameLog.length).toFixed(1);

  return `
    <div>
      <div class="glass" style="padding:16px;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
          <div>
            <div style="font-family:var(--font-display);font-size:2rem;font-weight:900;color:var(--teal)">${gameLog.length}</div>
            <div style="font-family:var(--font-display);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Sessions</div>
          </div>
          <div>
            <div style="font-family:var(--font-display);font-size:2rem;font-weight:900;color:var(--gold)">${avgPerf}</div>
            <div style="font-family:var(--font-display);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Avg Perf</div>
          </div>
          <div>
            <div style="font-family:var(--font-display);font-size:2rem;font-weight:900;color:var(--purple)">${avgConf}</div>
            <div style="font-family:var(--font-display);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Avg Conf</div>
          </div>
        </div>
      </div>
      ${[...gameLog].reverse().map((entry) => `
        <div class="glass" style="padding:16px;margin-bottom:10px;border-left:3px solid ${entry.type === 'practice' ? 'var(--purple)' : 'var(--teal)'}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div>
              <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${entry.type === 'practice' ? '🏋️ Practice' : `${sportTerms.emoji} ${sportTerms.event}`} · ${new Date(entry.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
              <div style="font-family:var(--font-display);font-weight:700;font-size:.95rem;text-transform:uppercase;margin-top:2px">${entry.qGood ? entry.qGood.slice(0,38) + (entry.qGood.length > 38 ? '…' : '') : 'Session Entry'}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-family:var(--font-display);font-size:1.6rem;font-weight:900;color:var(--teal);line-height:1">${entry.performance}</div>
              <div style="font-size:.65rem;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:.08em;text-transform:uppercase">/10 Perf</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <div style="background:rgba(168,175,189,.15);border-radius:50px;padding:3px 10px;font-family:var(--font-display);font-size:.72rem;font-weight:700;color:var(--purple)">Conf ${entry.confidence}/5</div>
            <div style="background:rgba(94,234,212,.1);border-radius:50px;padding:3px 10px;font-family:var(--font-display);font-size:.72rem;font-weight:700;color:var(--teal)">Focus ${'★'.repeat(Math.round(entry.mental||3))}${'☆'.repeat(5-Math.round(entry.mental||3))}</div>
          </div>
          ${entry.qNext ? `<div style="margin-top:8px;font-size:.78rem;color:var(--muted);border-top:1px solid var(--border);padding-top:8px;font-family:var(--font-body)">Next: ${entry.qNext}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderWeeklyTab(progress, navigate) {
  const checkins = [...(progress.weeklyCheckins || [])].reverse();
  const due = isWeeklyCheckinDue(progress);

  return `
    <div>
      ${due ? `
        <div class="glass" style="padding:24px;text-align:center;margin-bottom:18px;border-color:rgba(94,234,212,.25);background:linear-gradient(135deg,rgba(94,234,212,.08),transparent)">
          <div style="font-size:2.2rem;margin-bottom:8px">🗓️</div>
          <div style="font-family:var(--font-ui);font-weight:700;font-size:1.05rem;margin-bottom:6px">This week's check-in is open</div>
          <p style="color:var(--muted2);font-size:.85rem;margin-bottom:18px;line-height:1.5">A 1-minute pulse on effort, confidence, and consistency.</p>
          <button class="btn btn-primary" id="wc-start">Start Check-In →</button>
        </div>
      ` : `
        <div class="glass" style="padding:18px 22px;text-align:center;margin-bottom:18px">
          <div style="font-size:.85rem;color:var(--muted2)">✅ You've checked in this week — next one unlocks Monday.</div>
        </div>
      `}

      ${checkins.length === 0 ? `
        <div class="glass text-center" style="padding:40px 24px">
          <div style="font-size:3rem;margin-bottom:14px">📋</div>
          <h3 style="font-family:var(--font-display);font-size:1.15rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">No Check-Ins Yet</h3>
          <p style="color:var(--muted2);font-size:.85rem;font-family:var(--font-body);line-height:1.5">Your weekly reflections will build up here over time.</p>
        </div>
      ` : checkins.map(c => `
        <div class="glass" style="padding:16px;margin-bottom:10px;border-left:3px solid var(--teal)">
          <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Week of ${new Date(c.weekKey).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <div class="tile-pill">Effort ${c.effort}/5</div>
            <div class="tile-pill">Confidence ${c.confidence}/5</div>
            <div class="tile-pill">Consistency ${c.consistency}/5</div>
          </div>
          ${c.win ? `<div style="font-size:.85rem;margin-bottom:6px"><strong style="color:var(--teal)">Win:</strong> ${c.win}</div>` : ''}
          ${c.focus ? `<div style="font-size:.85rem;color:var(--muted2)"><strong style="color:var(--teal)">Focus:</strong> ${c.focus}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTrendsTab(progress, sportTerms, navigate) {
  const gameLog = progress.gameLog || [];

  if (gameLog.length < 3) {
    // Grayed-out sample chart placeholder
    const sampleData = [6,7,5,8,7,9];
    const sampleFocus = [4,3,4,5,4,5];
    const sampleConf = [3,4,3,5,4,5];
    return `
      <div style="opacity:.35;pointer-events:none;user-select:none">
        ${renderSVGLineChart('Mental Focus Over Time', sampleFocus, 5, 'var(--teal)')}
        ${renderSVGLineChart('Pre-Game Confidence', sampleConf, 5, 'var(--purple)')}
        ${renderSVGBarChart('Performance Rating', sampleData, 10, 'var(--teal)')}
      </div>
      <div class="glass text-center" style="padding:28px 24px;margin-top:-8px;position:relative;z-index:2">
        <div style="font-size:2.5rem;margin-bottom:10px">📈</div>
        <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Log 3 Sessions to Unlock Trends</div>
        <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;font-family:var(--font-body);line-height:1.5">Track at least 3 ${sportTerms.event.toLowerCase()}s to see your mental performance trends over time.</p>
        <button class="btn btn-primary" id="trends-go-log">Log a ${sportTerms.event} →</button>
      </div>
    `;
  }

  const last8   = gameLog.slice(-8);
  const avgFocus = (last8.reduce((s,e) => s + (e.mental||3), 0) / last8.length).toFixed(1);
  const avgConf  = (last8.reduce((s,e) => s + (e.confidence||3), 0) / last8.length).toFixed(1);
  const avgPerf  = (last8.reduce((s,e) => s + (e.performance||5), 0) / last8.length).toFixed(1);

  const best = gameLog.length >= 5 ? Math.max(...gameLog.map(e => e.performance)) : null;
  const first3 = gameLog.slice(0, 3);
  const lastN  = gameLog.slice(-3);
  const avg1Perf = first3.reduce((s,e) => s + e.performance, 0) / 3;
  const avg2Perf = lastN.reduce((s,e) => s + e.performance, 0) / 3;
  const trendLabel = avg2Perf > avg1Perf + 0.5 ? '📈 Improving' : avg2Perf < avg1Perf - 0.5 ? '💪 Keep grinding' : '➡️ Staying consistent';

  return `
    <div>
      <!-- Summary stats -->
      <div class="glass" style="padding:18px 20px;margin-bottom:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div>
          <div style="font-family:var(--font-display);font-size:1.8rem;font-weight:900;color:var(--teal)">${avgFocus}</div>
          <div style="font-family:var(--font-display);font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Avg Focus</div>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:1.8rem;font-weight:900;color:var(--purple)">${avgConf}</div>
          <div style="font-family:var(--font-display);font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Avg Conf</div>
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:1.8rem;font-weight:900;color:var(--gold)">${avgPerf}</div>
          <div style="font-family:var(--font-display);font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Avg Perf</div>
        </div>
      </div>

      <!-- Trend insight -->
      <div class="glass" style="padding:14px 18px;margin-bottom:16px;border-left:3px solid var(--teal);display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:var(--font-display);font-weight:700;font-size:.9rem">${trendLabel}</div>
        ${best ? `<div style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--gold)">Best: ${best}/10</div>` : ''}
      </div>

      ${renderSVGLineChart('Mental Focus Over Time', last8.map(e => e.mental||3), 5, 'var(--teal)', last8.map(e => new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})))}
      ${renderSVGLineChart('Pre-Game Confidence', last8.map(e => e.confidence||3), 5, 'var(--purple)', last8.map(e => new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})))}
      ${renderSVGBarChart('Performance Rating', last8.map(e => e.performance||5), 10, 'var(--teal)', last8.map(e => new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})))}
    </div>
  `;
}

function renderSVGLineChart(title, data, maxVal, color, labels = []) {
  const W = 340, H = 100, pad = 16;
  const n = data.length;
  if (n < 2) return '';
  const xStep = (W - pad * 2) / (n - 1);
  const yScale = (H - pad * 2) / maxVal;
  const points = data.map((v, i) => `${pad + i * xStep},${H - pad - v * yScale}`).join(' ');

  return `
    <div class="glass chart-wrap" style="margin-bottom:14px;padding:18px">
      <div style="font-family:var(--font-display);font-weight:900;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px">${title}</div>
      <svg viewBox="0 0 ${W} ${H + 24}" width="100%" style="overflow:visible">
        <!-- Grid lines -->
        ${[1,2,3,4,5].slice(0, maxVal).map(v => `
          <line x1="${pad}" y1="${H - pad - v * yScale}" x2="${W - pad}" y2="${H - pad - v * yScale}"
            stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        `).join('')}
        <!-- Fill area -->
        <defs>
          <linearGradient id="fill-${title.replace(/\s/g,'')}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <polygon points="${points} ${pad + (n-1)*xStep},${H - pad} ${pad},${H - pad}"
          fill="url(#fill-${title.replace(/\s/g,'')})" />
        <!-- Line -->
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          style="filter:drop-shadow(0 0 4px ${color})"/>
        <!-- Dots -->
        ${data.map((v, i) => `
          <circle cx="${pad + i * xStep}" cy="${H - pad - v * yScale}" r="4"
            fill="${color}" stroke="#14171D" stroke-width="2"
            style="filter:drop-shadow(0 0 4px ${color})"/>
        `).join('')}
        <!-- X labels -->
        ${labels.length > 0 ? labels.map((l, i) => `
          <text x="${pad + i * xStep}" y="${H + 18}" text-anchor="middle"
            font-family="Barlow Condensed, sans-serif" font-size="9" font-weight="600"
            fill="#64748B" letter-spacing="0.5">
            ${l.split(' ').join('\n')}
          </text>
        `).join('') : data.map((_, i) => `
          <text x="${pad + i * xStep}" y="${H + 18}" text-anchor="middle"
            font-family="Barlow Condensed, sans-serif" font-size="9" font-weight="600" fill="#64748B">
            ${i + 1}
          </text>
        `).join('')}
      </svg>
    </div>
  `;
}

function renderSVGBarChart(title, data, maxVal, color, labels = []) {
  const W = 340, H = 100, pad = 16;
  const n = data.length;
  const barW = Math.max(8, (W - pad * 2) / n - 6);
  const yScale = (H - pad * 2) / maxVal;
  const gap = (W - pad * 2) / n;

  return `
    <div class="glass chart-wrap" style="margin-bottom:14px;padding:18px">
      <div style="font-family:var(--font-display);font-weight:900;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px">${title}</div>
      <svg viewBox="0 0 ${W} ${H + 24}" width="100%" style="overflow:visible">
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.25"/>
          </linearGradient>
        </defs>
        ${data.map((v, i) => {
          const bh = Math.max(4, v * yScale);
          const bx = pad + i * gap + (gap - barW) / 2;
          const by = H - pad - bh;
          return `
            <rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="3"
              fill="url(#bar-fill)" style="filter:drop-shadow(0 0 4px ${color}44)"/>
            ${labels[i] ? `
              <text x="${bx + barW/2}" y="${H + 18}" text-anchor="middle"
                font-family="Barlow Condensed, sans-serif" font-size="9" font-weight="600" fill="#64748B">
                ${labels[i]}
              </text>
            ` : `
              <text x="${bx + barW/2}" y="${H + 18}" text-anchor="middle"
                font-family="Barlow Condensed, sans-serif" font-size="9" font-weight="600" fill="#64748B">
                ${i + 1}
              </text>
            `}
          `;
        }).join('')}
      </svg>
    </div>
  `;
}

export function attachTrackerEvents(navigate) {
  const progress   = getProgress();
  const user       = getUser();
  const sportTerms = getSportTerms(user?.sport);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = buildTrackerHTML(progress, navigate);
      document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'tracker'));
      attachTrackerEvents(navigate);
    });
  });

  document.getElementById('wc-start')?.addEventListener('click', () => navigate('weeklycheckin'));

  // Performance slider
  const perfSlider = document.getElementById('perf-slider');
  const perfVal    = document.getElementById('perf-val');
  perfSlider?.addEventListener('input', () => perfVal.textContent = perfSlider.value);

  // Confidence slider
  const confSlider = document.getElementById('conf-slider');
  const confVal    = document.getElementById('conf-val');
  confSlider?.addEventListener('input', () => confVal.textContent = confSlider.value);

  // Entry type
  let entryType = 'game';
  document.querySelectorAll('.entry-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      entryType = btn.dataset.type;
      document.querySelectorAll('.entry-type-btn').forEach(b => {
        b.style.borderColor = b === btn ? 'var(--teal)' : '';
        b.style.color       = b === btn ? 'var(--teal)' : '';
      });
    });
  });

  // Mental rating
  let mentalVal = 3;
  document.querySelectorAll('.mental-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mentalVal = parseInt(btn.dataset.val);
      document.querySelectorAll('.mental-btn').forEach(b => {
        b.style.borderColor = b === btn ? 'var(--teal)' : 'var(--border)';
        b.style.background  = b === btn ? 'rgba(94,234,212,.1)' : 'none';
        b.style.transform   = b === btn ? 'scale(1.18)' : 'scale(1)';
      });
    });
  });

  // Save entry
  document.getElementById('save-entry')?.addEventListener('click', () => {
    const gameDate = document.getElementById('game-date')?.value;
    const entry = {
      date:        gameDate ? new Date(gameDate + 'T12:00:00').getTime() : Date.now(),
      type:        entryType,
      performance: parseInt(document.getElementById('perf-slider')?.value || 7),
      confidence:  parseInt(document.getElementById('conf-slider')?.value || 3),
      mental:      mentalVal,
      qGood:       document.getElementById('q-good')?.value.trim(),
      qControl:    document.getElementById('q-control')?.value.trim(),
      qNext:       document.getElementById('q-next')?.value.trim()
    };

    const pr = getProgress();
    pr.gameLog = pr.gameLog || [];
    pr.gameLog.push(entry);

    // Badge
    pr.badges = pr.badges || [];
    if (!pr.badges.includes('journal_1')) {
      pr.badges.push('journal_1');
      showToast('Badge: First Reflection! 📝', '🏅');
    }
    saveProgress(pr);
    fireConfetti();
    showToast(`${sportTerms.event} logged! 📊`, '✅');

    // Future game reminder prompt
    const isFuture = entry.date > Date.now() + 30 * 60 * 1000; // > 30 min from now
    if (isFuture && localStorage.getItem('mindrep_reminders') !== 'false') {
      showReminderPrompt(entry, user, navigate);
    } else {
      activeTab = 'history';
      document.getElementById('app').innerHTML = buildTrackerHTML(pr, navigate);
      document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'tracker'));
      attachTrackerEvents(navigate);
    }
  });

  // Empty state CTAs
  document.getElementById('go-log')?.addEventListener('click', () => {
    activeTab = 'journal';
    document.getElementById('app').innerHTML = buildTrackerHTML(progress, navigate);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'tracker'));
    attachTrackerEvents(navigate);
  });
  document.getElementById('trends-go-log')?.addEventListener('click', () => {
    activeTab = 'journal';
    document.getElementById('app').innerHTML = buildTrackerHTML(progress, navigate);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'tracker'));
    attachTrackerEvents(navigate);
  });
}

function showReminderPrompt(entry, user, navigate) {
  // Show a modal banner
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:rgba(0,0,0,0.6);
    display:flex;align-items:flex-end;
    backdrop-filter:blur(4px);
    animation:fadeIn .2s ease;
  `;
  const gameDate = new Date(entry.date);
  const dateStr  = gameDate.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });

  overlay.innerHTML = `
    <div style="
      background:var(--bg2);
      border:1px solid var(--border-bright);
      border-top-left-radius:16px;border-top-right-radius:16px;
      padding:28px 24px;width:100%;max-width:430px;margin:0 auto;
      animation:fadeUp .3s ease;
    ">
      <div style="font-size:2rem;margin-bottom:10px">🔔</div>
      <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Want a mental warm-up reminder?</div>
      <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;font-family:var(--font-body);line-height:1.5">
        We'll remind you to open MindRep 1 hour before your ${entry.type === 'game' ? 'game' : 'session'} on ${dateStr}.
      </p>
      <div style="display:flex;gap:10px">
        <button id="reminder-yes" class="btn btn-primary" style="flex:1;font-size:.85rem">Yes, remind me ✓</button>
        <button id="reminder-no"  class="btn btn-secondary" style="flex:.5;font-size:.85rem">No thanks</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    const pr = getProgress();
    activeTab = 'history';
    document.getElementById('app').innerHTML = buildTrackerHTML(pr, navigate);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'tracker'));
    attachTrackerEvents(navigate);
  };

  overlay.querySelector('#reminder-yes').addEventListener('click', () => {
    Notification.requestPermission?.().then(perm => {
      localStorage.setItem('mindrep_reminders', 'true');
      localStorage.setItem('mindrep_next_game', entry.date.toString());
      showToast('Reminder set! Open the app before your game. 🔔', '✅', 3000);
    });
    close();
  });
  overlay.querySelector('#reminder-no').addEventListener('click', close);
}
