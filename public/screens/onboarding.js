// screens/onboarding.js

import { SPORTS, AGE_GROUPS } from '../data/lessons.js';
import { saveUser, saveProgress, getProgress } from '../utils/storage.js';
import { showToast } from '../utils/gamification.js';
import { heroIllustration } from '../utils/illustrations.js';

export function renderOnboarding(onComplete) {
  let step = 1;
  let name = '';
  let sport = '';
  let ageGroup = '';

  const app = document.getElementById('app');

  function render() {
    app.innerHTML = `
      <div class="onboard-wrap">
        ${step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
      </div>
    `;
    attachEvents();
  }

  function renderStep1() {
    return `
      <div style="animation:fadeUp .4s ease">
        <div class="onboard-logo">MindRep</div>
        <p style="font-size:.9rem;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;font-weight:600;margin-bottom:24px">Mental Performance · Ages 10–18</p>
        <div style="margin-bottom:8px">${heroIllustration({ size: 160 })}</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:1.75rem;font-weight:900;margin-bottom:12px;line-height:1.3">Train Your Mind.<br>Dominate Your Game.</h2>
        <p style="color:var(--muted);font-size:.95rem;margin-bottom:40px;line-height:1.6;max-width:320px">5-10 minute daily lessons based on elite sports psychology. Build mental toughness in 30 days.</p>
        <div style="width:100%;max-width:360px;margin:0 auto">
          <input id="name-input" type="text" placeholder="Enter your first name" value="${name}"
            style="width:100%;background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:18px 20px;color:var(--text);font-size:1.05rem;font-family:'Outfit',sans-serif;font-weight:600;margin-bottom:16px;transition:border-color .2s"
          />
          <button id="step1-next" class="btn btn-primary btn-block btn-lg">Get Started →</button>
        </div>
        <p style="margin-top:20px;font-size:.75rem;color:var(--muted)">Free to start • No credit card required</p>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div style="animation:fadeUp .4s ease;width:100%;max-width:400px">
        <div style="font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:8px">Step 2 of 3</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:900;margin-bottom:8px">What's your sport?</h2>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:24px">We'll personalize your lessons with relevant scenarios.</p>
        <div class="sport-grid">
          ${SPORTS.map(s => `
            <button class="sport-btn ${sport === s.id ? 'selected' : ''}" data-sport="${s.id}">
              <span class="sport-emoji">${s.emoji}</span>
              ${s.name}
            </button>
          `).join('')}
        </div>
        <div style="margin-top:24px;display:flex;gap:10px">
          <button id="step2-back" class="btn btn-secondary" style="flex:.4">← Back</button>
          <button id="step2-next" class="btn btn-primary" style="flex:1">Continue →</button>
        </div>
      </div>
    `;
  }

  function renderStep3() {
    return `
      <div style="animation:fadeUp .4s ease;width:100%;max-width:400px">
        <div style="font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:8px">Step 3 of 3</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:900;margin-bottom:8px">How old are you?</h2>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:32px">This helps us set the right tone and difficulty for your lessons.</p>
        <div style="display:flex;flex-direction:column;gap:12px;width:100%;margin-bottom:32px">
          ${AGE_GROUPS.map(ag => `
            <button class="age-btn ${ageGroup === ag.id ? 'selected' : ''}" data-age="${ag.id}"
              style="display:flex;align-items:center;gap:16px;text-align:left;border-radius:14px;padding:18px 20px">
              <span style="font-size:2rem">${ag.emoji}</span>
              <div>
                <div style="font-weight:800;font-size:1.1rem">${ag.label}</div>
                <div style="font-size:.8rem;color:var(--muted);font-weight:500">${ag.sublabel}</div>
              </div>
            </button>
          `).join('')}
        </div>
        <div style="display:flex;gap:10px">
          <button id="step3-back" class="btn btn-secondary" style="flex:.4">← Back</button>
          <button id="step3-next" class="btn btn-primary" style="flex:1">Start Training 🔥</button>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    if (step === 1) {
      const input = document.getElementById('name-input');
      input.addEventListener('input', e => name = e.target.value.trim());
      input.addEventListener('focus', e => e.target.style.borderColor = 'var(--teal)');
      input.addEventListener('blur', e => e.target.style.borderColor = 'rgba(255,255,255,.12)');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') goNext(); });
      document.getElementById('step1-next').addEventListener('click', goNext);
    }
    if (step === 2) {
      document.querySelectorAll('.sport-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          sport = btn.dataset.sport;
          document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
      document.getElementById('step2-back').addEventListener('click', () => { step = 1; render(); });
      document.getElementById('step2-next').addEventListener('click', goNext);
    }
    if (step === 3) {
      document.querySelectorAll('.age-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          ageGroup = btn.dataset.age;
          document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
      document.getElementById('step3-back').addEventListener('click', () => { step = 2; render(); });
      document.getElementById('step3-next').addEventListener('click', goNext);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!name) { showToast('Enter your name to continue', '👋'); return; }
      step = 2;
    } else if (step === 2) {
      if (!sport) { showToast('Pick your sport!', '🏅'); return; }
      step = 3;
    } else if (step === 3) {
      if (!ageGroup) { showToast('Select your age group', '📅'); return; }
      const user = { name, sport, ageGroup, createdAt: Date.now() };
      saveUser(user);
      const progress = getProgress();
      progress.lastActiveDate = new Date().toDateString();
      progress.streak = 1;
      saveProgress(progress);
      onComplete(user);
      return;
    }
    render();
  }

  render();
}
