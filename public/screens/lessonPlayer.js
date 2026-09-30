// screens/lessonPlayer.js — focused listening view for a narrated lesson.
//
// Layout (see design-notes.md, "Audio & Video Lessons"): a large progress ring
// built from the logo's concentric rings with play/pause at its center, time,
// a thin scrubber, one row of secondary controls, an optional ambient level,
// then the lesson text underneath for reading along. Nothing autoplays.

import {
  openSession, getListenState, formatTime, spokenTime,
  SKIP_SECONDS, SPEEDS
} from '../utils/lessonAudio.js';

const RING_R = 104;
const RING_C = 2 * Math.PI * RING_R;

const ICONS = {
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.2-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>`,
  done: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  fwd: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ambient: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
};

/**
 * Render the listening view into `container`.
 * `readAlong` is HTML for the text under the player.
 * `onContinue` runs from the completion state's primary button.
 * Returns an unmount function (detaches UI; playback is closed separately).
 */
export function mountLessonPlayer(container, { lesson, moduleTitle, readAlong, continueLabel, onContinue }) {
  const session = openSession(lesson, { moduleTitle });
  const saved = getListenState(lesson.id);

  container.innerHTML = `
    <section class="player" aria-label="Lesson audio">
      <div class="player-ring-wrap">
        <svg class="player-ring" viewBox="0 0 240 240" aria-hidden="true">
          <circle class="ring-track" cx="120" cy="120" r="${RING_R}"/>
          <circle class="ring-progress" id="ring-progress" cx="120" cy="120" r="${RING_R}"
            stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${RING_C.toFixed(2)}"/>
          <circle class="ring-mid" cx="120" cy="120" r="76"/>
        </svg>
        <button class="player-play" id="player-play" type="button" aria-label="Play lesson"></button>
      </div>

      <div class="player-status" id="player-status" aria-live="polite"></div>

      <div class="player-time">
        <span id="player-elapsed">0:00</span>
        <span id="player-remaining">--:--</span>
      </div>
      <input class="player-scrub" id="player-scrub" type="range" min="0" max="1000" step="1" value="0"
        aria-label="Position in lesson">

      <div class="player-controls">
        <button class="player-ctl" id="player-back" type="button" aria-label="Back ${SKIP_SECONDS} seconds">
          ${ICONS.back}<span>${SKIP_SECONDS}</span>
        </button>
        <button class="player-speed" id="player-speed" type="button"></button>
        <button class="player-ctl" id="player-fwd" type="button" aria-label="Forward ${SKIP_SECONDS} seconds">
          ${ICONS.fwd}<span>${SKIP_SECONDS}</span>
        </button>
      </div>

      ${session.hasAmbient ? `
        <label class="player-ambient">
          ${ICONS.ambient}
          <span class="player-ambient-label">Ambient</span>
          <input class="player-scrub" type="range" id="player-ambient" min="0" max="100" step="1"
            value="${Math.round(session.ambientLevel * 100)}" aria-label="Ambient sound volume"
            style="--pct:${Math.round(session.ambientLevel * 100)}%">
        </label>` : ''}

      <div class="player-complete" id="player-complete" hidden>
        <div class="player-complete-title">Lesson complete</div>
        <p class="player-complete-sub">Take a breath. When you're ready, put it into practice.</p>
        <button class="btn btn-primary btn-block" id="player-continue" type="button">${continueLabel}</button>
        <button class="btn btn-secondary btn-block" id="player-replay" type="button">Listen again</button>
      </div>
    </section>

    <section class="read-along" aria-label="Lesson text">
      <div class="read-along-label">Read along</div>
      ${readAlong}
    </section>
  `;

  const $ = id => container.querySelector('#' + id);
  const els = {
    ring: $('ring-progress'), play: $('player-play'), status: $('player-status'),
    elapsed: $('player-elapsed'), remaining: $('player-remaining'), scrub: $('player-scrub'),
    speed: $('player-speed'), complete: $('player-complete'), ambient: $('player-ambient'),
    wrap: container.querySelector('.player')
  };

  let scrubbing = false;
  let showedComplete = false;

  function statusText() {
    if (session.error) return 'Audio couldn’t load. You can still read the lesson below.';
    if (session.playing || session.currentTime > 0) return '';
    if (session.resumeAt > 0) return `Picks up at ${formatTime(session.resumeAt)}`;
    return saved.completed ? 'Listened before · tap to hear it again' : 'Tap to begin';
  }

  function paint(type) {
    const d = session.duration;
    const t = scrubbing ? (els.scrub.value / 1000) * d : (session.currentTime || session.resumeAt);
    const pct = d ? Math.min(1, t / d) : 0;
    const showFull = session.completed;

    els.ring.style.strokeDashoffset = (RING_C * (1 - (showFull ? 1 : pct))).toFixed(2);
    els.elapsed.textContent = formatTime(t);
    els.remaining.textContent = d ? `-${formatTime(d - t)}` : '--:--';
    if (!scrubbing) els.scrub.value = Math.round(pct * 1000);
    els.scrub.style.setProperty('--pct', `${(pct * 100).toFixed(2)}%`);
    els.scrub.setAttribute('aria-valuetext',
      d ? `${spokenTime(t)} of ${spokenTime(d)}` : 'Loading');

    if (type === 'time') return;

    const icon = session.completed ? 'done' : session.playing ? 'pause' : 'play';
    if (els.play.dataset.icon !== icon) {
      els.play.dataset.icon = icon;
      els.play.innerHTML = ICONS[icon];
    }
    els.play.setAttribute('aria-label',
      session.completed ? 'Play lesson again' : session.playing ? 'Pause' : 'Play lesson');
    els.play.disabled = !!session.error;
    els.wrap.classList.toggle('is-playing', session.playing);
    els.wrap.classList.toggle('is-complete', session.completed);
    els.status.textContent = statusText();
    els.speed.textContent = `${session.rate}×`;
    els.speed.setAttribute('aria-label', `Playback speed ${session.rate}×. Change speed`);

    if (session.completed && !showedComplete) {
      showedComplete = true;
      els.complete.hidden = false;
      // Move focus to the calm completion state rather than leaving it on a
      // play button that now means "replay".
      requestAnimationFrame(() => $('player-continue')?.focus({ preventScroll: true }));
    } else if (!session.completed && showedComplete) {
      showedComplete = false;
      els.complete.hidden = true;
    }
  }

  els.play.addEventListener('click', () => session.toggle());
  $('player-back').addEventListener('click', () => session.skip(-SKIP_SECONDS));
  $('player-fwd').addEventListener('click', () => session.skip(SKIP_SECONDS));
  els.speed.addEventListener('click', () => {
    const i = SPEEDS.indexOf(session.rate);
    session.setRate(SPEEDS[(i + 1) % SPEEDS.length]);
  });

  els.scrub.addEventListener('input', () => { scrubbing = true; paint('time'); });
  els.scrub.addEventListener('change', () => {
    scrubbing = false;
    session.seek((els.scrub.value / 1000) * session.duration);
  });

  els.ambient?.addEventListener('input', () => {
    els.ambient.style.setProperty('--pct', `${els.ambient.value}%`);
    session.setAmbientLevel(els.ambient.value / 100);
  });

  $('player-continue').addEventListener('click', () => onContinue());
  $('player-replay').addEventListener('click', () => { session.seek(0); session.play(); });

  const unsubscribe = session.subscribe(type => paint(type));
  paint();

  return () => unsubscribe();
}
