// screens/lesson.js — Full 5-section interactive lesson player

import { MODULES } from '../data/lessons.js';
import { getProgress, saveProgress } from '../utils/storage.js';
import { completeLesson, checkAndUnlockBadges, fireConfetti, showToast, floatXP } from '../utils/gamification.js';
import { isAdmin } from '../utils/admin.js';
import { moduleIcon } from '../utils/illustrations.js';

let currentSection = 0;
let lessonData = null;
let moduleData = null;
let quizAnswers = [];
let quizPerfect = false;
let activityDone = false;
let sliderValues = {};
let builderSelections = {};
let swipedCards = new Set();
let navigateFn = null;

export function renderLesson(lessonId, navigate) {
  navigateFn = navigate;
  currentSection = 0;
  quizAnswers = [];
  quizPerfect = false;
  activityDone = false;
  sliderValues = {};
  builderSelections = {};
  swipedCards = new Set();

  // Find lesson
  for (const mod of MODULES) {
    for (const l of mod.lessons) {
      if (l.id === lessonId) {
        lessonData = l;
        moduleData = mod;
      }
    }
  }

  if (!lessonData || !lessonData.sections) {
    const admin = isAdmin();
    document.getElementById('app').innerHTML = admin
      ? `<div class="screen text-center" style="padding-top:80px">
          <div style="font-size:4rem">🚧</div>
          <h2 style="font-family:'Outfit',sans-serif;margin:16px 0 8px">Content Coming Soon</h2>
          <p style="color:var(--muted);margin-bottom:8px">This lesson is in development. Full content for all 7 modules will be added progressively.</p>
          <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(94,234,212,.1);border:1px solid rgba(94,234,212,.25);border-radius:50px;padding:8px 18px;font-size:.85rem;font-weight:700;color:var(--teal);margin-bottom:24px">⚡ Admin Mode — Lesson stub</div>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-secondary" id="locked-back">← Back</button>
            <button class="btn btn-primary" id="locked-home">🏠 Home</button>
          </div>
        </div>`
      : `<div class="screen text-center" style="padding-top:80px">
          <div style="font-size:4rem">🔒</div>
          <h2 style="font-family:'Outfit',sans-serif;margin:16px 0 8px">Premium Content</h2>
          <p style="color:var(--muted)">This lesson is part of MindRep+. Upgrade to unlock Modules 4–7.</p>
          <button class="btn btn-primary mt-24" id="locked-back">← Back to Home</button>
        </div>`;
    document.getElementById('locked-back')?.addEventListener('click', () => navigate('home'));
    document.getElementById('locked-home')?.addEventListener('click', () => navigate('home'));
    return;
  }

  renderSection();
}

function renderSection() {
  const app = document.getElementById('app');
  const section = lessonData.sections[currentSection];
  const totalSections = lessonData.sections.length;

  app.innerHTML = `
    <div class="screen" style="padding-top:20px">
      <!-- Header -->
        <div class="lesson-header">
          <button class="lesson-back" id="lesson-back">←</button>
          <div style="flex:1">
            <div style="font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:6px">
              ${moduleData.emoji} Module ${moduleData.id} · Lesson ${lessonData.id}
              <span class="time-pill">⏱ ${lessonData.duration} min</span>
            </div>
            <div style="font-family:var(--font-display);font-weight:900;font-size:1.1rem;text-transform:uppercase;letter-spacing:.02em">${lessonData.title}</div>
          </div>
          <div style="font-family:var(--font-display);font-size:.9rem;font-weight:900;color:var(--lime);letter-spacing:.04em">+${lessonData.xp} XP</div>
      </div>

      <!-- Progress steps -->
      <div class="lesson-step-bar">
        ${lessonData.sections.map((s, i) => `
          <div class="step-dot ${i < currentSection ? 'done' : i === currentSection ? 'active' : ''}"></div>
        `).join('')}
      </div>

      <!-- Section content -->
      <div class="lesson-content" id="lesson-content">
        ${renderSectionContent(section)}
      </div>
    </div>
  `;

  document.getElementById('lesson-back')?.addEventListener('click', () => {
    if (currentSection > 0) { currentSection--; renderSection(); }
    else navigateFn('home');
  });
  attachSectionEvents(section);
}

function renderSectionContent(section) {
  switch (section.type) {
    case 'hook': return renderHook(section);
    case 'instruction': return renderInstruction(section);
    case 'activity': return renderActivity(section);
    case 'quiz': return renderQuiz(section);
    case 'tiein': return renderTieIn(section);
    default: return '';
  }
}

function renderHook(section) {
  const c = section.content;
  const color = moduleData?.color || 'var(--teal)';
  return `
    <div class="lesson-card glass" style="margin-bottom:16px;overflow:hidden">
      <div style="margin:-26px -22px 18px;padding:26px 22px;text-align:center;background:linear-gradient(160deg,${color}22,${color}08);border-bottom:1px solid ${color}30">
        <div style="width:56px;height:56px;margin:0 auto;border-radius:14px;background:${color}20;display:flex;align-items:center;justify-content:center">
          ${moduleIcon(moduleData?.id, color, 30)}
        </div>
      </div>
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <div class="lesson-body">${c.body.replace(/\n/g, '<br>')}</div>
      ${c.question ? `<div class="lesson-highlight mt-16">💭 ${c.question}</div>` : ''}
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="section-next">Start Lesson →</button>
  `;
}

function renderInstruction(section) {
  const c = section.content;
  return `
    <div class="lesson-card glass" style="margin-bottom:16px">
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <div class="lesson-body">${c.body.replace(/\n/g, '<br>')}</div>
      ${c.highlight ? `<div class="lesson-highlight mt-16">${c.highlight}</div>` : ''}
    </div>
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <button class="btn btn-secondary" style="flex:.5;font-size:.85rem" id="narrate-btn">🔊 Listen</button>
      <button class="btn btn-primary" style="flex:1" id="section-next">Got it! →</button>
    </div>
  `;
}

function renderActivity(section) {
  const c = section.content;
  if (c.sliders) return renderSliderActivity(section);
  if (c.swipeCards) return renderSwipeActivity(section);
  if (c.builder) return renderBuilderActivity(section);
  return `<div class="lesson-card glass"><p>Activity</p></div>`;
}

function renderSliderActivity(section) {
  const c = section.content;
  return `
    <div class="lesson-card glass activity-card" style="margin-bottom:16px">
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:20px">${c.description}</p>
      ${c.sliders.map(s => `
        <div style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:600;font-size:.9rem">${s.emoji} ${s.label}</div>
            <div style="font-family:'Outfit',sans-serif;font-weight:800;color:var(--teal)" id="val-${s.id}">3</div>
          </div>
          <div class="slider-wrap">
            <span style="font-size:.75rem;color:var(--muted)">0</span>
            <input type="range" min="0" max="5" value="3" id="${s.id}" style="flex:1;accent-color:var(--teal)">
            <span style="font-size:.75rem;color:var(--muted)">5</span>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="section-next">Save My Baseline →</button>
  `;
}

function renderSwipeActivity(section) {
  const c = section.content;
  return `
    <div class="lesson-card glass activity-card" style="margin-bottom:16px">
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:20px">${c.description}</p>
      ${c.swipeCards.map((card, i) => `
        <div class="swipe-card glass" id="swipe-${i}" data-index="${i}">
          <div style="font-size:1.2rem;margin-bottom:6px">${card.emoji}</div>
          <div style="font-weight:700;color:var(--coral);margin-bottom:4px" id="swipe-text-${i}">${card.negative}</div>
          <div style="font-size:.75rem;color:var(--muted)">Tap to flip to neutral →</div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="section-next" ${swipedCards.size < c.swipeCards.length ? 'style="opacity:.5"' : ''}>
      ${swipedCards.size < c.swipeCards.length ? `Flip all cards (${swipedCards.size}/${c.swipeCards.length})` : 'Nice work! Continue →'}
    </button>
  `;
}

function renderBuilderActivity(section) {
  const c = section.content;
  return `
    <div class="lesson-card glass activity-card" style="margin-bottom:16px">
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:20px">${c.description}</p>
      ${c.builder.steps.map((step, si) => `
        <div style="margin-bottom:20px">
          <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:.85rem;color:var(--teal);margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase">
            Step ${si + 1}: ${step.step}
          </div>
          <div style="font-size:.9rem;color:var(--muted);margin-bottom:10px">${step.label}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${step.options.map((opt, oi) => `
              <button class="builder-opt ${builderSelections[si] === oi ? 'selected' : ''}" 
                data-step="${si}" data-opt="${oi}"
                style="padding:12px 16px;border-radius:10px;border:2px solid ${builderSelections[si] === oi ? 'var(--teal)' : 'var(--border)'};background:${builderSelections[si] === oi ? 'rgba(94,234,212,.1)' : 'var(--card)'};color:var(--text);font-size:.9rem;font-weight:600;text-align:left;cursor:pointer;transition:all .2s">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="section-next">Build My Reset →</button>
  `;
}

function renderQuiz(section) {
  const c = section.content;
  const currentQ = quizAnswers.length;
  if (currentQ >= c.questions.length) {
    return renderQuizComplete(section);
  }
  const q = c.questions[currentQ];
  return `
    <div class="lesson-card glass" style="margin-bottom:16px">
      <div class="lesson-section-tag">${section.emoji} ${section.label}</div>
      <div style="font-size:.75rem;color:var(--muted);font-weight:600;margin-bottom:12px">Question ${currentQ + 1} of ${c.questions.length}</div>
      <div class="lesson-title" style="font-size:1.2rem">${q.q}</div>
    </div>
    <div id="quiz-options">
      ${q.options.map((opt, i) => `
        <button class="quiz-option" data-qi="${i}" id="qopt-${i}">
          <span style="font-family:'Outfit',sans-serif;font-weight:700;color:var(--teal);margin-right:10px">${String.fromCharCode(65+i)}.</span>
          ${opt.replace(' ✓', '')}
        </button>
      `).join('')}
    </div>
  `;
}

function renderQuizComplete(section) {
  const total = section.content.questions.length;
  const correct = quizAnswers.filter(a => a).length;
  quizPerfect = correct === total;
  return `
    <div class="lesson-card glass text-center" style="padding:40px 24px;margin-bottom:16px">
      <div style="font-size:3.5rem;margin-bottom:12px">${quizPerfect ? '🎯' : '💪'}</div>
      <div class="lesson-section-tag" style="justify-content:center">${section.emoji} Quiz Complete</div>
      <div style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:900;margin:8px 0">${correct}/${total}</div>
      <div style="color:var(--muted);font-size:.9rem;margin-bottom:0">
        ${quizPerfect ? 'Perfect score! You crushed it 🏆' : 'Good effort! Keep going!'}
      </div>
    </div>
    <button class="btn btn-primary btn-block btn-lg" id="section-next">Continue →</button>
  `;
}

function renderTieIn(section) {
  const c = section.content;
  const isComplete = c.action === 'complete_module';
  return `
    <div class="lesson-card glass" style="margin-bottom:16px;border-color:rgba(168,175,189,.3)">
      <div class="lesson-section-tag" style="color:var(--gold)">${section.emoji} ${section.label}</div>
      <div class="lesson-title">${c.title}</div>
      <div class="lesson-body">${c.body.replace(/\n/g, '<br>')}</div>
      ${c.action === 'journal' && c.journalPrompt ? `
        <div style="margin-top:20px">
          <div style="font-size:.85rem;color:var(--muted);margin-bottom:8px">${c.journalPrompt}</div>
          <textarea class="reflection-textarea" id="journal-input" placeholder="Write your response..." rows="3"></textarea>
        </div>
      ` : ''}
    </div>
    <button class="btn ${isComplete ? 'btn-gold' : 'btn-primary'} btn-block btn-lg" id="section-next">
      ${isComplete ? '🏆 Finish Module!' : 'Complete Lesson ✓'}
    </button>
  `;
}

function attachSectionEvents(section) {
  // Back is bound once in renderSection(), where the header is created. Binding
  // it again here would double up: attachSectionEvents() also runs standalone
  // after each quiz question (without the header re-rendering), so a second
  // binding here would stack a new listener on the same button every question
  // and make one tap skip multiple sections.

  // Narrate
  document.getElementById('narrate-btn')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      const c = section.content;
      const text = c.body.replace(/<[^>]+>/g, '').replace(/\n/g, ' ');
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.pitch = 1;
      window.speechSynthesis.speak(utt);
      showToast('Playing narration...', '🔊', 2000);
    } else {
      showToast('Audio not supported on this device', '😔');
    }
  });

  // Sliders
  if (section.type === 'activity' && section.content.sliders) {
    section.content.sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const val = document.getElementById(`val-${s.id}`);
      if (el && val) {
        el.addEventListener('input', () => {
          sliderValues[s.id] = parseInt(el.value);
          val.textContent = el.value;
        });
      }
    });
  }

  // Swipe cards
  if (section.type === 'activity' && section.content.swipeCards) {
    const cards = section.content.swipeCards;
    cards.forEach((card, i) => {
      document.getElementById(`swipe-${i}`)?.addEventListener('click', () => {
        swipedCards.add(i);
        const textEl = document.getElementById(`swipe-text-${i}`);
        const cardEl = document.getElementById(`swipe-${i}`);
        if (textEl) {
          textEl.style.color = 'var(--teal)';
          textEl.textContent = card.neutral;
        }
        if (cardEl) {
          cardEl.classList.add('swiped-good');
          cardEl.querySelector('div:last-child').textContent = '✅ Neutral!';
        }
        const btn = document.getElementById('section-next');
        if (btn) {
          btn.style.opacity = swipedCards.size < cards.length ? '.5' : '1';
          btn.textContent = swipedCards.size < cards.length
            ? `Flip all cards (${swipedCards.size}/${cards.length})`
            : 'Nice work! Continue →';
        }
      });
    });
  }

  // Builder
  if (section.type === 'activity' && section.content.builder) {
    document.querySelectorAll('.builder-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const si = parseInt(btn.dataset.step);
        const oi = parseInt(btn.dataset.opt);
        builderSelections[si] = oi;
        // Update UI
        document.querySelectorAll(`[data-step="${si}"]`).forEach(b => {
          b.style.borderColor = 'var(--border)';
          b.style.background = 'var(--card)';
        });
        btn.style.borderColor = 'var(--teal)';
        btn.style.background = 'rgba(94,234,212,.1)';
      });
    });
  }

  // Quiz options
  if (section.type === 'quiz' && quizAnswers.length < (section.content.questions?.length || 0)) {
    const q = section.content.questions[quizAnswers.length];
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.qi);
        const correct = idx === q.correct;
        document.querySelectorAll('.quiz-option').forEach(b => b.style.pointerEvents = 'none');
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          document.getElementById(`qopt-${q.correct}`)?.classList.add('correct');
        }
        quizAnswers.push(correct);
        showToast(correct ? 'Correct! 🎯' : 'Not quite — check the answer', correct ? '✅' : '💡', 2000);
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'lesson-highlight';
          el.style.marginTop = '12px';
          el.innerHTML = `💡 ${q.explanation}`;
          document.getElementById('quiz-options')?.appendChild(el);
          setTimeout(() => {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-primary btn-block mt-12';
            nextBtn.textContent = quizAnswers.length < section.content.questions.length ? 'Next Question →' : 'See Results →';
            nextBtn.addEventListener('click', () => { document.getElementById('lesson-content').innerHTML = renderSectionContent(section); attachSectionEvents(section); });
            document.getElementById('quiz-options')?.appendChild(nextBtn);
          }, 800);
        }, 600);
      });
    });
  }

  // Next / complete
  document.getElementById('section-next')?.addEventListener('click', () => {
    // Save slider baselines
    if (section.type === 'activity' && section.content.sliders && Object.keys(sliderValues).length) {
      const progress = getProgress();
      progress.sliderBaselines = sliderValues;
      saveProgress(progress);
    }
    // Lesson 1.3's builder activity is where an athlete assembles their
    // personal reset routine — save it into the Toolbox so it's findable
    // again later instead of disappearing once the lesson is done.
    if (section.type === 'activity' && section.content.builder && lessonData.id === '1.3' && Object.keys(builderSelections).length) {
      const steps = section.content.builder.steps;
      const summary = steps.map((step, i) => step.options[builderSelections[i]]).filter(Boolean).join(' → ');
      if (summary) {
        const progress = getProgress();
        progress.resetRoutine = summary;
        saveProgress(progress);
      }
    }
    // Save journal (Lesson 1.2's neutral phrase and 3.1's control list also
    // feed the Toolbox, same reasoning as above)
    if (section.type === 'tiein' && section.content.action === 'journal') {
      const input = document.getElementById('journal-input');
      if (input?.value.trim()) {
        const progress = getProgress();
        progress.journalEntries = progress.journalEntries || [];
        progress.journalEntries.push({ date: Date.now(), lessonId: lessonData.id, text: input.value.trim() });
        if (lessonData.id === '1.2') progress.neutralPhrase = input.value.trim();
        if (lessonData.id === '3.1') progress.controlList = input.value.trim();
        saveProgress(progress);
      }
    }
    // Advance or complete
    if (currentSection < lessonData.sections.length - 1) {
      currentSection++;
      renderSection();
    } else {
      completeLessonFlow();
    }
  });
}

function completeLessonFlow() {
  const { progress, earned } = completeLesson(lessonData.id, lessonData.xp, quizPerfect);

  // Check module completion. This has to happen *before* the final badge
  // check below, or module-completion badges (e.g. "Mind Awakened") won't
  // show up until the next lesson is completed instead of this one.
  const modLessons = moduleData.lessons;
  const allDone = modLessons.every(l => progress.completedLessons.includes(l.id));
  if (allDone && !progress.completedModules.includes(moduleData.id)) {
    progress.completedModules.push(moduleData.id);
    const { progress: p2, earned: moduleBadges } = checkAndUnlockBadges(progress);
    saveProgress(p2);
    earned.push(...moduleBadges);
  }

  fireConfetti();
  // Floating XP animation
  const nextBtn = document.getElementById('section-next');
  floatXP(lessonData.xp, nextBtn);

  // Get a "take it to practice" tip based on lesson
  const practiceTips = {
    '1.1': 'Before your next practice, write down ONE mental strength you already have.',
    '1.2': 'Next time you make a mistake, say your reset phrase out loud before the next play.',
    '1.3': 'Use Recognize → Release → Refocus the next time you feel yourself spiral.',
    '2.1': 'Before practice, say your "No matter what, I will ___" statement out loud.',
    '2.2': 'Do ONE extra rep today — sprint, throw, or drill — more than you planned to.',
    '2.3': 'Find ONE thing about your current role to do better than anyone else on the team.',
    '3.1': 'Write your Circle of Control list before your next game. Takes 60 seconds.',
    '3.2': 'Pick your process cue phrase. Say it out loud once right now.',
    '3.3': 'Next time you make a mistake in practice, time your recovery — aim for under 90 seconds.',
    'default': 'Apply one thing from today\'s lesson at your next game or practice session.'
  };
  const tip = practiceTips[lessonData.id] || practiceTips['default'];

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen">
      <div class="celebration glass" style="margin-top:32px;border-color:rgba(94,234,212,.15)">
        <span class="big-emoji">${quizPerfect ? '🎯' : '⭐'}</span>
        <h2 style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:.04em">Lesson Complete!</h2>
        <p style="color:var(--muted2);font-size:.875rem">${lessonData.title}</p>
        <div class="xp-earned" style="animation:pulseLime 1.5s ease">+${lessonData.xp} XP EARNED</div>
        ${earned.length ? `
          <div style="margin:12px 0">
            <div style="font-family:var(--font-display);font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">🏅 Badge${earned.length > 1 ? 's' : ''} Unlocked!</div>
            ${earned.map(b => `
              <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(168,175,189,.1);border:1px solid rgba(168,175,189,.3);border-radius:6px;padding:8px 18px;margin:4px;font-family:var(--font-display);font-weight:700;font-size:.9rem;animation:badgeGlow .5s ease">
                ${b.icon} ${b.name}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Take It To Practice tip -->
      <div class="glass" style="padding:20px;margin-top:14px;border-left:3px solid var(--teal)">
        <div style="font-family:var(--font-display);font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);margin-bottom:8px">⚡ Take It To Practice</div>
        <div style="font-size:.9rem;color:var(--muted2);line-height:1.6;font-family:var(--font-body)">${tip}</div>
      </div>

      <!-- Streak + nav -->
      <div class="glass" style="padding:18px;margin-top:14px;display:flex;align-items:center;justify-content:space-between">
        <div class="streak-badge">🔥 ${progress.streak} day${progress.streak !== 1 ? 's' : ''}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" id="go-home">🏠 Home</button>
          <button class="btn btn-primary btn-sm" id="go-next">Next →</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('go-home')?.addEventListener('click', () => navigateFn('home'));
  document.getElementById('go-next')?.addEventListener('click', () => {
    const completed = progress.completedLessons;
    const adminMode = isAdmin();
    let next = null;
    for (const mod of MODULES) {
      if (!adminMode && mod.locked) continue;
      for (const lesson of mod.lessons) {
        if (!completed.includes(lesson.id)) { next = lesson; break; }
      }
      if (next) break;
    }
    if (next) navigateFn('lesson', { lessonId: next.id });
    else navigateFn('home');
  });
}
