// screens/practice.js — Premium Practice Hub

import { COACH_RESPONSES } from '../data/lessons.js';
import { getProgress, saveProgress, getCoachChat, saveCoachChat } from '../utils/storage.js';
import { showToast, fireConfetti } from '../utils/gamification.js';
import { coachAvatar } from '../utils/illustrations.js';

let breathInterval = null;
let breathPhase = 'ready';
let breathCount = 0;
let activeTab = 'breathe';

export function renderPractice(navigate, params = {}) {
  activeTab = params.tab || 'breathe';
  return buildPracticeHTML();
}

function buildPracticeHTML() {
  const tabs = [
    { id: 'breathe',   label: '💨 Breathe' },
    { id: 'checklist', label: '✅ Pre-Game' },
    { id: 'visualize', label: '🎯 Visualize' },
    { id: 'coach',     label: '🤖 AI Coach' }
  ];

  return `
    <div class="screen" style="padding-top:24px">
      <h1 style="font-family:'Outfit',sans-serif;font-size:1.75rem;font-weight:900;margin-bottom:20px">Practice Hub</h1>

      <!-- Tabs -->
      <div class="tab-bar">
        ${tabs.map(tab => `
          <button class="tab-btn ${activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- Tab content -->
      <div id="practice-content">
        ${activeTab === 'breathe'   ? renderBreatheTab()   :
          activeTab === 'checklist' ? renderChecklistTab() :
          activeTab === 'visualize' ? renderVisualizeTab() :
          renderCoachTab()}
      </div>
    </div>
  `;
}

function renderBreatheTab() {
  return `
    <div style="text-align:center">
      <div class="glass" style="padding:36px 24px 28px;margin-bottom:16px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-30%;left:-10%;width:180px;height:180px;background:radial-gradient(circle,rgba(94,234,212,0.06),transparent);border-radius:50%;pointer-events:none"></div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:900;margin-bottom:6px">Box Breathing</h2>
        <p style="color:var(--muted2);font-size:.85rem;margin-bottom:32px">Used by Navy SEALs & elite athletes to calm nerves instantly.</p>
        
        <!-- Premium breathing circle -->
        <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px">
          <!-- Outer ring -->
          <div id="breath-outer-ring" style="position:absolute;width:220px;height:220px;border-radius:50%;border:1px solid rgba(94,234,212,0.12);transition:all 1s ease;pointer-events:none"></div>
          <div class="breath-circle" id="breath-circle">Ready</div>
        </div>

        <div id="breath-instruction" style="font-family:'Outfit',sans-serif;font-size:1.1rem;font-weight:700;height:32px;transition:all .4s;color:var(--muted2)">
          Press Start when ready
        </div>

        <!-- Phase progress dots -->
        <div id="breath-phases" style="display:flex;gap:10px;justify-content:center;margin:12px 0 20px">
          ${['Inhale','Hold','Exhale','Hold'].map((p,i) => `
            <div class="breath-phase-dot" data-phase="${i}" style="display:flex;flex-direction:column;align-items:center;gap:4px;opacity:.3;transition:opacity .3s">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--teal)"></div>
              <div style="font-size:.6rem;font-weight:700;letter-spacing:.05em;color:var(--muted2)">${p.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>

        <div id="breath-counter" style="font-size:.8rem;color:var(--muted);margin-bottom:16px;height:20px"></div>

        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" id="breath-start" style="min-width:130px">▶&nbsp; Start</button>
          <button class="btn btn-secondary" id="breath-stop" style="min-width:130px;display:none">⏹&nbsp; Stop</button>
        </div>
      </div>

      <!-- Pattern guide -->
      <div class="glass" style="padding:20px">
        <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:.95rem;margin-bottom:14px">📐 The 4-4-4-4 Pattern</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">
          ${[
            { phase: 'Inhale',  count: '4s', color: 'var(--teal)',   desc: 'Breathe in slowly',   emoji: '⬆️' },
            { phase: 'Hold',    count: '4s', color: 'var(--gold)',   desc: 'Hold at the top',     emoji: '⏸' },
            { phase: 'Exhale',  count: '4s', color: 'var(--coral)',  desc: 'Release slowly',      emoji: '⬇️' },
            { phase: 'Hold',    count: '4s', color: 'var(--purple)', desc: 'Hold at the bottom',  emoji: '⏸' }
          ].map(p => `
            <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid var(--border)">
              <div style="color:${p.color};font-weight:700;font-size:.85rem;margin-bottom:2px">${p.emoji} ${p.phase} · ${p.count}</div>
              <div style="color:var(--muted2);font-size:.75rem">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderChecklistTab() {
  const progress = getProgress();
  const todayKey = new Date().toDateString();
  const checklist = progress.preGameChecklist || {};
  const todayChecklist = checklist[todayKey] || {};

  const items = [
    { id: 'sleep',     emoji: '😴', label: 'Got 7–9 hours of sleep',      category: 'Body' },
    { id: 'hydrate',   emoji: '💧', label: 'Hydrated well today',          category: 'Body' },
    { id: 'meal',      emoji: '🥗', label: 'Ate a good pre-game meal',     category: 'Body' },
    { id: 'warmup',    emoji: '🏃', label: 'Completed warm-up routine',    category: 'Body' },
    { id: 'neutral',   emoji: '😐', label: 'Said my neutral reset phrase', category: 'Mind' },
    { id: 'focus',     emoji: '🎯', label: 'Identified my controllables',  category: 'Mind' },
    { id: 'breath',    emoji: '💨', label: 'Did my breathing reset',       category: 'Mind' },
    { id: 'visualize', emoji: '🏆', label: 'Visualized success',           category: 'Mind' },
    { id: 'gear',      emoji: '🎽', label: 'Gear is ready to go',          category: 'Logistics' },
    { id: 'time',      emoji: '⏰', label: 'Know the game time & place',   category: 'Logistics' }
  ];

  const completedCount = items.filter(it => todayChecklist[it.id]).length;
  const pct = Math.round((completedCount / items.length) * 100);

  return `
    <div>
      <!-- Progress header -->
      <div class="glass" style="padding:22px;margin-bottom:18px;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(94,234,212,0.06),rgba(168,175,189,0.04));pointer-events:none"></div>
        <div style="font-size:3rem;font-weight:900;font-family:'Outfit',sans-serif;color:var(--teal);line-height:1;margin-bottom:4px">${completedCount}<span style="font-size:1.5rem;opacity:.5">/${items.length}</span></div>
        <div style="font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Pre-Game Checks Complete</div>
        <div class="xp-bar-wrap">
          <div class="xp-bar" style="width:${pct}%;background:${pct === 100 ? 'linear-gradient(90deg,var(--green),var(--teal))' : 'linear-gradient(90deg,var(--teal),var(--purple))'}"></div>
        </div>
        ${pct === 100 ? `<div style="margin-top:10px;font-size:.8rem;font-weight:700;color:var(--green)">✓ Game Day Ready!</div>` : `<div style="margin-top:10px;font-size:.75rem;color:var(--muted)">${items.length - completedCount} remaining</div>`}
      </div>

      ${['Body', 'Mind', 'Logistics'].map(cat => `
        <div style="margin-bottom:18px">
          <div class="section-heading" style="margin-top:0;margin-bottom:10px;font-size:.9rem">${cat}</div>
          ${items.filter(it => it.category === cat).map(it => `
            <div class="glass" style="display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all .2s;border-color:${todayChecklist[it.id] ? 'rgba(94,234,212,.35)' : 'var(--border)'}${todayChecklist[it.id] ? ';background:rgba(94,234,212,0.06)' : ''}"
              id="check-${it.id}">
              <div style="font-size:1.4rem">${it.emoji}</div>
              <div style="flex:1;font-size:.9rem;font-weight:600${todayChecklist[it.id] ? ';text-decoration:line-through;opacity:.6' : ''}">${it.label}</div>
              <div style="width:26px;height:26px;border-radius:50%;border:2px solid ${todayChecklist[it.id] ? 'var(--green)' : 'var(--border)'};background:${todayChecklist[it.id] ? 'var(--green)' : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;transition:all .25s cubic-bezier(.34,1.56,.64,1)">
                ${todayChecklist[it.id] ? '✓' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      ${completedCount === items.length ? `
        <div class="glass" style="text-align:center;padding:28px;border-color:rgba(168,175,189,.3);background:linear-gradient(135deg,rgba(168,175,189,0.08),transparent);margin-top:4px">
          <div style="font-size:3rem;margin-bottom:10px">🏆</div>
          <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:6px">Game Day Ready!</div>
          <div style="color:var(--muted2);font-size:.875rem">You've prepared your mind and body. Go dominate.</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderVisualizeTab() {
  const scripts = [
    {
      title: 'Perfect Performance',
      emoji: '🏆',
      duration: '3 min',
      color: 'var(--gold)',
      text: 'Close your eyes. Take three slow breaths.\n\nVisualize yourself arriving at your venue. The energy is electric. You feel calm, prepared, ready.\n\nSee yourself warming up — movements fluid, sharp, confident. Your body knows exactly what to do. You\'ve done this a thousand times.\n\nNow see the game begin. You make your first play — smooth, precise. You stay present. When the pressure rises, you breathe. "Next play."\n\nSee yourself finish the game having given everything. Win or lose, you stayed focused. You controlled what you could. You\'re proud.\n\nTake a breath. Open your eyes. You\'re ready.'
    },
    {
      title: 'Reset from a Mistake',
      emoji: '🔄',
      duration: '2 min',
      color: 'var(--teal)',
      text: 'Close your eyes. Breathe in for 4... hold for 4... out for 4...\n\nYou just made a mistake. It\'s okay — it happened. Acknowledge it without judgment.\n\nNow: Recognize. You see the mistake clearly.\nRelease. Shake your hands. The moment is gone.\nRefocus. Your next play is all that exists.\n\nSay your reset phrase. Feel your body relax into the present moment.\n\nYou are not your mistakes. You are what you do next.\n\nOpen your eyes. You\'re reset.'
    },
    {
      title: 'Pre-Game Calm',
      emoji: '😌',
      duration: '2 min',
      color: 'var(--purple)',
      text: 'Find a comfortable position. Close your eyes.\n\nScan your body from head to toe. Release any tension in your jaw. Drop your shoulders. Unclench your hands.\n\nBreathe in... 1, 2, 3, 4. Hold... 1, 2, 3, 4. Out... 1, 2, 3, 4.\n\nNerves are normal. They mean you care. Channel them into focus.\n\nYou are prepared. You have trained for this. Trust your preparation.\n\nWhen you open your eyes, you\'ll feel centered and ready.'
    }
  ];

  return `
    <div>
      <p style="color:var(--muted2);font-size:.875rem;margin-bottom:20px;line-height:1.6">Guided visualization sessions used by elite athletes to build confidence and focus.</p>
      ${scripts.map((s, i) => `
        <div class="glass practice-card" id="viz-${i}" style="border-left:3px solid ${s.color};cursor:pointer">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="font-size:2.4rem">${s.emoji}</div>
            <div style="flex:1">
              <div class="practice-title">${s.title}</div>
              <div class="practice-sub">Guided audio visualization</div>
              <div class="practice-duration">⏱ ${s.duration}</div>
            </div>
            <div style="font-size:1.2rem;opacity:.4">▶</div>
          </div>
        </div>
      `).join('')}

      <!-- Visualization player -->
      <div id="viz-player" style="display:none;animation:fadeUp .35s ease">
        <div class="glass" style="padding:32px 24px;text-align:center;border-color:rgba(94,234,212,.2)">
          <div style="font-size:3rem;margin-bottom:12px" id="viz-emoji"></div>
          <div style="font-family:'Outfit',sans-serif;font-weight:900;font-size:1.2rem;margin-bottom:20px" id="viz-title"></div>
          <div style="font-size:.95rem;line-height:1.85;color:rgba(241,245,249,.82);text-align:left;white-space:pre-line;margin-bottom:28px" id="viz-text"></div>
          <div id="viz-tts-status" style="font-size:.75rem;color:var(--teal);margin-bottom:16px;display:none">🔊 Reading aloud...</div>
          <button class="btn btn-primary btn-block" id="viz-close">Done ✓</button>
        </div>
      </div>
    </div>
  `;
}

function renderCoachTab() {
  // Chat history lives in progress, so it follows the athlete to any device.
  const history = getCoachChat();
  const hasHistory = history.length > 0;

  return `
    <div>
      <!-- Coach greeting card (shown when no history) -->
      ${!hasHistory ? `
        <div class="glass" style="padding:22px;margin-bottom:16px;border-color:rgba(94,234,212,.2);background:linear-gradient(135deg,rgba(94,234,212,.07),rgba(168,175,189,.04))">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
            ${coachAvatar({ size: 52 })}
            <div>
              <div style="font-family:var(--font-display);font-weight:900;font-size:1.1rem;text-transform:uppercase;letter-spacing:.04em">Coach Neutral</div>
              <div style="font-size:.72rem;color:var(--teal);font-family:var(--font-display);font-weight:700;letter-spacing:.08em;text-transform:uppercase">● Online · Available 24/7</div>
            </div>
          </div>
          <div class="coach-bubble" style="margin-bottom:0">
            Hey, I'm Coach Neutral. I use Trevor Moad's neutral thinking framework to help you perform better. Ask me anything about your sport, your mindset, or how to handle a tough moment. 🧠
          </div>
        </div>

        <!-- Starter prompts -->
        <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Suggested Questions</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
          ${[
            { label: 'How do I reset after a bad play?',               key: 'reset'     },
            { label: 'What should I do the night before a big game?',  key: 'pregame'   },
            { label: "I'm struggling with confidence — help.",         key: 'confidence'}
          ].map(p => `
            <button class="glass coach-quick" data-key="${p.key}"
              style="padding:14px 16px;border-radius:8px;text-align:left;font-family:var(--font-body);font-size:.9rem;font-weight:600;color:var(--text);display:flex;align-items:center;gap:10px;border-color:rgba(94,234,212,.15);transition:all .15s">
              <span style="color:var(--teal);font-size:1rem">→</span> ${p.label}
            </button>
          `).join('')}
        </div>
      ` : `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          ${coachAvatar({ size: 36 })}
          <div>
            <div style="font-family:var(--font-display);font-weight:900;font-size:.9rem;text-transform:uppercase;letter-spacing:.04em">Coach Neutral</div>
            <div style="font-size:.65rem;color:var(--teal);font-family:var(--font-display);font-weight:700;letter-spacing:.08em;text-transform:uppercase">● Online</div>
          </div>
          <button id="chat-clear" style="margin-left:auto;background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-family:var(--font-display);font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);cursor:pointer">Clear</button>
        </div>
        <!-- Render saved history -->
        <div id="chat-messages" style="margin-bottom:12px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px">
          ${history.map(m => m.role === 'user'
            ? `<div class="user-bubble">${m.text}</div>`
            : `<div class="coach-bubble">${m.text}</div>`
          ).join('')}
        </div>
      `}

      ${hasHistory ? '' : `<div id="chat-messages" style="margin-bottom:12px;max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:2px"></div>`}

      <!-- Quick prompts (always shown) -->
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px">
        ${[
          { label: '😰 Nervous',    key: 'nervous'    },
          { label: '😐 Mistake',    key: 'mistake'    },
          { label: '😰 Pressure',   key: 'pressure'   },
          { label: '💪 Confidence', key: 'confidence' }
        ].map(p => `
          <button class="btn btn-secondary btn-sm coach-quick" data-key="${p.key}" style="border-radius:50px;font-size:.75rem">${p.label}</button>
        `).join('')}
      </div>

      <div class="chat-input-row">
        <input class="chat-input" id="chat-input" type="text" placeholder="Ask Coach Neutral anything..." autocomplete="off" />
        <button class="chat-send" id="chat-send">→</button>
      </div>
    </div>
  `;
}

export function attachPracticeEvents(navigate) {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      document.getElementById('app').innerHTML = buildPracticeHTML();
      document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.screen === 'practice');
      });
      attachPracticeEvents(navigate);
    });
  });

  // Breathing
  document.getElementById('breath-start')?.addEventListener('click', startBreathing);
  document.getElementById('breath-stop')?.addEventListener('click', stopBreathing);

  // Checklist
  const progress = getProgress();
  const todayKey = new Date().toDateString();
  const checklist = progress.preGameChecklist || {};
  const todayChecklist = checklist[todayKey] || {};
  const items = ['sleep','hydrate','meal','warmup','neutral','focus','breath','visualize','gear','time'];
  items.forEach(id => {
    document.getElementById(`check-${id}`)?.addEventListener('click', () => {
      todayChecklist[id] = !todayChecklist[id];
      checklist[todayKey] = todayChecklist;
      progress.preGameChecklist = checklist;
      saveProgress(progress);
      document.getElementById('practice-content').innerHTML = renderChecklistTab();
      attachChecklistEvents();
      const count = items.filter(i => todayChecklist[i]).length;
      if (count === items.length) {
        fireConfetti();
        showToast('Pre-game checklist complete! 🏆', '✅');
      }
    });
  });

  // Visualization
  const scripts = [
    { title: 'Perfect Performance', emoji: '🏆', text: 'Close your eyes. Take three slow breaths.\n\nVisualize yourself arriving at your venue. The energy is electric. You feel calm, prepared, ready.\n\nSee yourself warming up — movements fluid, sharp, confident. Your body knows exactly what to do. You\'ve done this a thousand times.\n\nNow see the game begin. You make your first play — smooth, precise. You stay present. When the pressure rises, you breathe. "Next play."\n\nSee yourself finish the game having given everything. Win or lose, you stayed focused. You controlled what you could. You\'re proud.\n\nTake a breath. Open your eyes. You\'re ready.' },
    { title: 'Reset from a Mistake', emoji: '🔄', text: 'Close your eyes. Breathe in for 4... hold for 4... out for 4...\n\nYou just made a mistake. It\'s okay — it happened. Acknowledge it without judgment.\n\nNow: Recognize. You see the mistake clearly.\nRelease. Shake your hands. The moment is gone.\nRefocus. Your next play is all that exists.\n\nSay your reset phrase. Feel your body relax into the present moment.\n\nYou are not your mistakes. You are what you do next.\n\nOpen your eyes. You\'re reset.' },
    { title: 'Pre-Game Calm', emoji: '😌', text: 'Find a comfortable position. Close your eyes.\n\nScan your body from head to toe. Release any tension in your jaw. Drop your shoulders. Unclench your hands.\n\nBreathe in... 1, 2, 3, 4. Hold... 1, 2, 3, 4. Out... 1, 2, 3, 4.\n\nNerves are normal. They mean you care. Channel them into focus.\n\nYou are prepared. You have trained for this. Trust your preparation.\n\nWhen you open your eyes, you\'ll feel centered and ready.' }
  ];

  scripts.forEach((s, i) => {
    document.getElementById(`viz-${i}`)?.addEventListener('click', () => {
      const player = document.getElementById('viz-player');
      document.getElementById('viz-emoji').textContent = s.emoji;
      document.getElementById('viz-title').textContent = s.title;
      document.getElementById('viz-text').textContent = s.text;
      if (player) player.style.display = 'block';
      // Scroll player into view
      setTimeout(() => player?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      // TTS
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(s.text);
        utt.rate = 0.82; utt.pitch = 0.92;
        const statusEl = document.getElementById('viz-tts-status');
        if (statusEl) statusEl.style.display = 'block';
        utt.onend = () => { if (statusEl) statusEl.style.display = 'none'; };
        window.speechSynthesis.speak(utt);
      }
      const pr = getProgress();
      pr.breathSessions = (pr.breathSessions || 0) + 1;
      saveProgress(pr);
    });
  });

  document.getElementById('viz-close')?.addEventListener('click', () => {
    const player = document.getElementById('viz-player');
    if (player) player.style.display = 'none';
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    showToast('Visualization complete! 🎯', '🧠');
  });

  // AI Coach
  document.querySelectorAll('.coach-quick').forEach(btn => {
    btn.addEventListener('click', () => sendCoachMessage(btn.dataset.key));
  });
  document.getElementById('chat-clear')?.addEventListener('click', () => {
    saveCoachChat([]);
    activeTab = 'coach';
    document.getElementById('app').innerHTML = buildPracticeHTML();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === 'practice'));
    attachPracticeEvents(navigate);
  });
  document.getElementById('chat-send')?.addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    if (input?.value.trim()) {
      sendCoachMessage(input.value.trim(), true);
      input.value = '';
    }
  });
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const input = document.getElementById('chat-input');
      if (input?.value.trim()) {
        sendCoachMessage(input.value.trim(), true);
        input.value = '';
      }
    }
  });
}

function attachChecklistEvents() {
  const progress = getProgress();
  const todayKey = new Date().toDateString();
  const checklist = progress.preGameChecklist || {};
  const todayChecklist = checklist[todayKey] || {};
  const items = ['sleep','hydrate','meal','warmup','neutral','focus','breath','visualize','gear','time'];
  items.forEach(id => {
    document.getElementById(`check-${id}`)?.addEventListener('click', () => {
      todayChecklist[id] = !todayChecklist[id];
      checklist[todayKey] = todayChecklist;
      progress.preGameChecklist = checklist;
      saveProgress(progress);
      document.getElementById('practice-content').innerHTML = renderChecklistTab();
      attachChecklistEvents();
      const count = items.filter(i => todayChecklist[i]).length;
      if (count === items.length) { fireConfetti(); showToast('Pre-game checklist complete! 🏆', '✅'); }
    });
  });
}

function startBreathing() {
  document.getElementById('breath-start').style.display = 'none';
  document.getElementById('breath-stop').style.display = 'inline-flex';
  breathCount = 0;

  const phases = [
    { label: 'Inhale', duration: 4, class: 'inhale', color: 'var(--teal)',   phaseIdx: 0 },
    { label: 'Hold',   duration: 4, class: 'hold',   color: 'var(--gold)',   phaseIdx: 1 },
    { label: 'Exhale', duration: 4, class: 'exhale', color: 'var(--coral)',  phaseIdx: 2 },
    { label: 'Hold',   duration: 4, class: '',        color: 'var(--purple)', phaseIdx: 3 }
  ];

  let phaseIndex = 0;
  let secondsLeft = phases[0].duration;

  function runPhase() {
    const phase = phases[phaseIndex];
    const circle = document.getElementById('breath-circle');
    const instruction = document.getElementById('breath-instruction');
    const counter = document.getElementById('breath-counter');
    if (!circle) { stopBreathing(); return; }

    // Update circle
    circle.className = `breath-circle ${phase.class}`;
    circle.textContent = `${secondsLeft}`;
    circle.style.borderColor = phase.color;
    circle.style.color = phase.color;

    // Update instruction
    if (instruction) {
      instruction.textContent = phase.label.toUpperCase();
      instruction.style.color = phase.color;
    }

    // Update phase dots
    document.querySelectorAll('.breath-phase-dot').forEach((dot, i) => {
      dot.style.opacity = i === phase.phaseIdx ? '1' : '0.25';
    });

    // Counter
    if (counter) counter.textContent = breathCount > 0 ? `Cycle ${breathCount + 1} of 4` : '  ';

    secondsLeft--;
    if (secondsLeft < 0) {
      phaseIndex = (phaseIndex + 1) % phases.length;
      if (phaseIndex === 0) breathCount++;
      secondsLeft = phases[phaseIndex].duration;
    }

    if (breathCount >= 4) {
      stopBreathing();
      const pr = getProgress();
      pr.breathSessions = (pr.breathSessions || 0) + 1;
      saveProgress(pr);
      showToast('4 cycles complete! 💨', '✅');
      if (circle) {
        circle.className = 'breath-circle';
        circle.textContent = '✓';
        circle.style.borderColor = 'var(--green)';
        circle.style.color = 'var(--green)';
        circle.style.boxShadow = '0 0 40px rgba(94,234,212,0.4)';
      }
      if (instruction) { instruction.textContent = 'Session Complete 🙌'; instruction.style.color = 'var(--green)'; }
      if (counter) counter.textContent = '4 cycles · Well done!';
      // Reset phase dots
      document.querySelectorAll('.breath-phase-dot').forEach(d => d.style.opacity = '1');
      return;
    }
    breathInterval = setTimeout(runPhase, 1000);
  }
  runPhase();
}

function stopBreathing() {
  clearTimeout(breathInterval);
  breathInterval = null;
  const startBtn = document.getElementById('breath-start');
  const stopBtn = document.getElementById('breath-stop');
  if (startBtn) startBtn.style.display = 'inline-flex';
  if (stopBtn) stopBtn.style.display = 'none';
}

function sendCoachMessage(keyOrText, isUserText = false) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const labels = {
    nervous:    "I'm feeling nervous 😰",
    mistake:    "I just made a mistake 😤",
    pressure:   "I'm feeling a lot of pressure 😰",
    confidence: "I need a confidence boost 💪",
    reset:      "How do I reset after a bad play?",
    pregame:    "What should I do the night before a big game?",
  };

  const userText = isUserText ? keyOrText : (labels[keyOrText] || keyOrText);

  const userMsg = document.createElement('div');
  userMsg.className = 'user-bubble';
  userMsg.textContent = userText;
  container.appendChild(userMsg);
  container.scrollTop = container.scrollHeight;

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'coach-bubble';
  typing.style.opacity = '0.5';
  typing.textContent = '...';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const coachMsg = document.createElement('div');
    coachMsg.className = 'coach-bubble';
    let response = COACH_RESPONSES.default;
    if (!isUserText) {
      response = COACH_RESPONSES[keyOrText] || COACH_RESPONSES.default;
    } else {
      const lower = keyOrText.toLowerCase();
      if (lower.includes('nerv') || lower.includes('anxious') || lower.includes('scared'))      response = COACH_RESPONSES.nervous;
      else if (lower.includes('mistake') || lower.includes('error') || lower.includes('mess'))  response = COACH_RESPONSES.mistake;
      else if (lower.includes('pressure') || lower.includes('stress'))                          response = COACH_RESPONSES.pressure;
      else if (lower.includes('confid') || lower.includes('believe'))                           response = COACH_RESPONSES.confidence;
      else if (lower.includes('reset') || lower.includes('bad play') || lower.includes('spiral')) response = COACH_RESPONSES.reset;
      else if (lower.includes('night') || lower.includes('before') || lower.includes('pregame'))  response = COACH_RESPONSES.pregame;
    }
    coachMsg.textContent = response;
    container.appendChild(coachMsg);
    container.scrollTop = container.scrollHeight;

    // Persist to the athlete's synced progress
    const history = [...getCoachChat()];
    history.push({ role: 'user', text: userText });
    history.push({ role: 'coach', text: response });
    // Keep last 20 messages only
    if (history.length > 20) history.splice(0, history.length - 20);
    saveCoachChat(history);
  }, 900);
}

