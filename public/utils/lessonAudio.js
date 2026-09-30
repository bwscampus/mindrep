// utils/lessonAudio.js — narration + optional ambient bed for one lesson.
//
// Two plain <audio> elements, deliberately NOT routed through Web Audio for
// the narration: a media element is what browsers keep playing when the
// screen locks, and what the lock-screen controls (Media Session) attach to.
// An AudioContext gets suspended on lock on iOS, so routing the voice
// through it would cut the lesson off mid-sentence.
//
// Fades use element.volume. iOS Safari ignores writes to element.volume
// (it's always 1, the hardware buttons own it), so there:
//   - narration plays at full volume with no code fades, which is why the
//     narration files themselves should have short fades baked in
//   - the ambient bed is routed through a Web Audio GainNode instead, since
//     it's the one thing that must sit quietly under the voice. If the
//     context is suspended on lock, only the bed stops; the voice continues.
//
// One lesson plays at a time. The engine lives outside the DOM, so the
// player UI can re-render freely without interrupting playback.

import { getProgress, saveProgress } from './storage.js';

export const SKIP_SECONDS = 15;
export const SPEEDS = [1, 1.25, 1.5];
export const DEFAULT_AMBIENT_LEVEL = 0.25;

const FADE_IN_MS = 1200;
const FADE_OUT_MS = 400;
const AMBIENT_END_FADE_MS = 4000;
const SAVE_EVERY_MS = 5000;
// Resuming inside the last few seconds would just replay the ending.
const RESUME_TAIL_SECONDS = 8;

const ARTWORK = [{ src: 'assets/lesson-artwork.png', sizes: '512x512', type: 'image/png' }];

let active = null;

export const canSetVolume = (() => {
  try {
    const probe = document.createElement('audio');
    probe.volume = 0.5;
    return probe.volume === 0.5;
  } catch { return false; }
})();

/** A lesson's saved listening state: { position, completed }. */
export function getListenState(lessonId) {
  return getProgress().lessonAudio?.[lessonId] || { position: 0, completed: false };
}

function saveListenState(lessonId, patch) {
  const progress = getProgress();
  progress.lessonAudio = progress.lessonAudio || {};
  progress.lessonAudio[lessonId] = { ...getListenState(lessonId), ...patch };
  saveProgress(progress);
}

// ---------------------------------------------------------------------------
// Volume channels
// ---------------------------------------------------------------------------

/** Wraps one audio element with a settable gain, whatever the platform. */
function makeChannel(el, { needsGain }) {
  let ctx = null;
  let gainNode = null;
  let level = 1;

  function ensureGraph() {
    if (canSetVolume || !needsGain || gainNode) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      ctx = new Ctx();
      gainNode = ctx.createGain();
      gainNode.gain.value = level;
      ctx.createMediaElementSource(el).connect(gainNode).connect(ctx.destination);
    } catch { gainNode = null; }
  }

  return {
    el,
    get level() { return level; },
    set(v) {
      level = Math.max(0, Math.min(1, v));
      if (canSetVolume) el.volume = level;
      else if (gainNode) gainNode.gain.value = level;
    },
    // Must run inside a user gesture the first time (autoplay policy).
    prime() {
      ensureGraph();
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    },
    // Whether this channel can actually fade on this device.
    get fadeable() { return canSetVolume || !!gainNode; },
    close() { ctx?.close().catch(() => {}); }
  };
}

/** Ease a channel from its current level to `to`. Timer-based, not rAF, so
 *  it still completes while the page is in the background. */
function fade(channel, to, ms, token) {
  return new Promise(resolve => {
    if (!channel.fadeable || ms <= 0) { channel.set(to); resolve(); return; }
    const from = channel.level;
    const start = performance.now();
    const step = () => {
      if (token.cancelled) { resolve(); return; }
      const t = Math.min(1, (performance.now() - start) / ms);
      // Ease-in-out sine: no overshoot, gentle at both ends.
      const eased = 0.5 - Math.cos(Math.PI * t) / 2;
      channel.set(from + (to - from) * eased);
      if (t < 1) setTimeout(step, 30);
      else resolve();
    };
    step();
  });
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/**
 * Open (but never autoplay) a listening session for a lesson.
 * `lesson` needs { id, title, audioUrl, ambientUrl? }.
 * Returns the existing session if this lesson is already loaded.
 */
export function openSession(lesson, { moduleTitle = '' } = {}) {
  if (active?.lessonId === lesson.id) return active;
  closeSession();

  const voiceEl = new Audio();
  voiceEl.preload = 'metadata';
  voiceEl.src = lesson.audioUrl;
  voiceEl.preservesPitch = true;

  let ambientEl = null;
  if (lesson.ambientUrl) {
    ambientEl = new Audio();
    ambientEl.preload = 'none';
    ambientEl.loop = true;
    ambientEl.src = lesson.ambientUrl;
  }

  const voice = makeChannel(voiceEl, { needsGain: false });
  const ambient = ambientEl ? makeChannel(ambientEl, { needsGain: true }) : null;
  const listeners = new Set();
  let fadeToken = { cancelled: false };
  let lastSave = 0;
  let ambientLevel = DEFAULT_AMBIENT_LEVEL;
  let playing = false;
  let completed = false;

  const saved = getListenState(lesson.id);
  let resumeAt = saved.position || 0;

  const session = {
    lessonId: lesson.id,
    get playing() { return playing; },
    get completed() { return completed; },
    get currentTime() { return voiceEl.currentTime || 0; },
    get duration() { return Number.isFinite(voiceEl.duration) ? voiceEl.duration : 0; },
    get rate() { return voiceEl.playbackRate; },
    get resumeAt() { return resumeAt; },
    get hasAmbient() { return !!ambient; },
    get ambientLevel() { return ambientLevel; },
    get error() { return voiceEl.error; },

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async play() {
      if (playing) return;
      newFadeToken();
      completed = false;
      voice.prime();
      ambient?.prime();
      if (voiceEl.ended) voiceEl.currentTime = 0;
      voice.set(voice.fadeable ? 0 : 1);
      try {
        await voiceEl.play();
      } catch {
        emit();
        return;
      }
      playing = true;
      setupMediaSession();
      emit();
      const token = fadeToken;
      fade(voice, 1, FADE_IN_MS, token);
      if (ambient && ambientLevel > 0) {
        ambient.set(0);
        ambient.el.play().catch(() => {});
        fade(ambient, ambientLevel, FADE_IN_MS * 2, token);
      }
    },

    // Ease down, then pause — never a hard cut.
    async pause() {
      if (!playing) return;
      playing = false;
      emit();
      const token = newFadeToken();
      await Promise.all([
        fade(voice, 0, FADE_OUT_MS, token),
        ambient ? fade(ambient, 0, FADE_OUT_MS, token) : null
      ]);
      if (token.cancelled) return;
      voiceEl.pause();
      ambient?.el.pause();
      persist(true);
    },

    toggle() { return playing ? session.pause() : session.play(); },

    seek(seconds) {
      const d = session.duration;
      if (!d) { resumeAt = Math.max(0, seconds); return; }
      voiceEl.currentTime = Math.max(0, Math.min(d - 0.25, seconds));
      if (completed) completed = false;
      persist(true);
      emit();
    },

    skip(delta) { session.seek(session.currentTime + delta); },

    setRate(rate) {
      voiceEl.playbackRate = rate;
      updatePositionState();
      emit();
    },

    setAmbientLevel(v) {
      ambientLevel = Math.max(0, Math.min(1, v));
      if (!ambient) return;
      newFadeToken();
      ambient.set(ambientLevel);
      if (playing && ambientLevel > 0 && ambient.el.paused) ambient.el.play().catch(() => {});
      if (ambientLevel === 0) ambient.el.pause();
      emit();
    },

    close() {
      newFadeToken();
      persist(true);
      voiceEl.pause();
      ambient?.el.pause();
      voiceEl.removeAttribute('src');
      voiceEl.load();
      if (ambient) { ambient.el.removeAttribute('src'); ambient.el.load(); }
      voice.close();
      ambient?.close();
      clearMediaSession();
      listeners.clear();
    }
  };

  function newFadeToken() {
    fadeToken.cancelled = true;
    fadeToken = { cancelled: false };
    return fadeToken;
  }

  function emit(type = 'change') {
    listeners.forEach(fn => { try { fn(type, session); } catch (e) { console.error(e); } });
  }

  function persist(force = false) {
    const now = Date.now();
    if (!force && now - lastSave < SAVE_EVERY_MS) return;
    lastSave = now;
    const d = session.duration;
    let position = voiceEl.currentTime || 0;
    if (d && position > d - RESUME_TAIL_SECONDS) position = 0;
    saveListenState(lesson.id, { position: Math.round(position) });
  }

  // --- element events -----------------------------------------------------

  voiceEl.addEventListener('loadedmetadata', () => {
    if (resumeAt > 0 && resumeAt < session.duration - RESUME_TAIL_SECONDS) {
      voiceEl.currentTime = resumeAt;
    } else {
      resumeAt = 0;
    }
    emit();
  });

  voiceEl.addEventListener('timeupdate', () => {
    persist();
    updatePositionState();
    emit('time');
  });

  voiceEl.addEventListener('ended', () => {
    playing = false;
    completed = true;
    resumeAt = 0;
    const token = newFadeToken();
    if (ambient && !ambient.el.paused) {
      fade(ambient, 0, AMBIENT_END_FADE_MS, token).then(() => {
        if (!token.cancelled) ambient.el.pause();
      });
    }
    saveListenState(lesson.id, { position: 0, completed: true });
    if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
    // A single short pulse — a nudge, not an alert. No-op where unsupported
    // (including iOS Safari, which has no Vibration API).
    try { navigator.vibrate?.(18); } catch { /* ignore */ }
    emit('ended');
  });

  // Paused from outside our controls (headphones unplugged, a call, the
  // lock screen on platforms without action handlers).
  voiceEl.addEventListener('pause', () => {
    if (playing && !voiceEl.ended) {
      playing = false;
      ambient?.el.pause();
      persist(true);
      emit();
    }
  });

  voiceEl.addEventListener('error', () => { playing = false; emit('error'); });

  // --- lock screen / hardware keys ----------------------------------------

  function setupMediaSession() {
    const ms = navigator.mediaSession;
    if (!ms) return;
    try {
      ms.metadata = new MediaMetadata({
        title: lesson.title,
        artist: 'MindRep',
        album: moduleTitle,
        artwork: ARTWORK
      });
    } catch { /* MediaMetadata missing on older browsers */ }
    const handlers = {
      play: () => session.play(),
      pause: () => session.pause(),
      stop: () => session.pause(),
      seekbackward: d => session.skip(-(d?.seekOffset || SKIP_SECONDS)),
      seekforward: d => session.skip(d?.seekOffset || SKIP_SECONDS),
      seekto: d => { if (d?.seekTime != null) session.seek(d.seekTime); }
    };
    for (const [action, fn] of Object.entries(handlers)) {
      try { ms.setActionHandler(action, fn); } catch { /* unsupported action */ }
    }
    ms.playbackState = 'playing';
  }

  let lastPositionUpdate = 0;
  function updatePositionState() {
    const ms = navigator.mediaSession;
    if (!ms?.setPositionState || !session.duration) return;
    const now = Date.now();
    if (now - lastPositionUpdate < 1000) return;
    lastPositionUpdate = now;
    try {
      ms.setPositionState({
        duration: session.duration,
        playbackRate: voiceEl.playbackRate,
        position: Math.min(voiceEl.currentTime, session.duration)
      });
    } catch { /* ignore invalid transient states */ }
    ms.playbackState = playing ? 'playing' : 'paused';
  }

  function clearMediaSession() {
    const ms = navigator.mediaSession;
    if (!ms) return;
    ms.metadata = null;
    for (const a of ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto']) {
      try { ms.setActionHandler(a, null); } catch { /* ignore */ }
    }
    ms.playbackState = 'none';
  }

  // Safari 17+: declare this as media playback, so the silent switch
  // doesn't mute the lesson and it's allowed to continue in the background.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* ignore */ }

  active = session;
  return session;
}

/** Ease the loaded lesson down to a pause, keeping it ready to resume. */
export function pauseActive() {
  active?.pause();
}

/** Stop and release whatever lesson is loaded. Safe to call any time. */
export function closeSession() {
  if (!active) return;
  const s = active;
  active = null;
  s.close();
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "2 minutes 13 seconds", for screen readers. */
export function spokenTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  parts.push(`${r} second${r === 1 ? '' : 's'}`);
  return parts.join(' ');
}
