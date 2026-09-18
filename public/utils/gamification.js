// utils/gamification.js — XP, badges, streaks, confetti

import { BADGES } from '../data/lessons.js';
import { getProgress, saveProgress, addXP, updateStreak } from './storage.js';

export function unlockBadge(badgeId) {
  const progress = getProgress();
  if (progress.badges.includes(badgeId)) return null;
  progress.badges.push(badgeId);
  saveProgress(progress);
  const badge = BADGES.find(b => b.id === badgeId);
  return badge;
}

export function checkAndUnlockBadges(progress) {
  const earned = [];
  const completed = progress.completedLessons || [];
  const streak = progress.streak || 0;
  const xp = progress.xp || 0;
  const existing = progress.badges || [];

  const try_unlock = (id) => {
    if (!existing.includes(id)) {
      existing.push(id);
      const b = BADGES.find(b => b.id === id);
      if (b) earned.push(b);
    }
  };

  if (completed.length >= 1) try_unlock('first_lesson');
  if (completed.includes('1.2')) try_unlock('neutral_thinker');
  if (completed.includes('1.3')) try_unlock('reset_master');
  if ((progress.completedModules || []).includes(1)) try_unlock('module_1');
  if ((progress.completedModules || []).includes(2)) try_unlock('no_excuses');
  if (streak >= 3) try_unlock('streak_3');
  if (streak >= 7) try_unlock('streak_7');
  if ((progress.gameLog || []).length >= 1) try_unlock('journal_1');
  if (xp >= 500) try_unlock('xp_500');
  if ((progress.breathSessions || 0) >= 1) try_unlock('breathwork');
  if ((progress.completedModules || []).length >= 7) try_unlock('captain');

  // Locked In mode — ongoing-habit badges
  const repsCount = Object.keys(progress.dailyReps || {}).length;
  if (streak >= 30) try_unlock('streak_30');
  if (repsCount >= 10) try_unlock('reps_10');
  if (repsCount >= 30) try_unlock('reps_30');
  if ((progress.weeklyCheckins || []).length >= 1) try_unlock('checkin_1');

  progress.badges = existing;
  return { progress, earned };
}

export function completeLesson(lessonId, xpAmount, quizPerfect = false) {
  let progress = getProgress();
  progress = updateStreak(progress);

  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    progress = addXP(progress, xpAmount);
  }

  if (quizPerfect) {
    const key = `perfect_${lessonId}`;
    if (!progress.badges.includes('quiz_perfect')) {
      progress.badges.push('quiz_perfect');
    }
  }

  const { progress: p2, earned } = checkAndUnlockBadges(progress);
  saveProgress(p2);
  return { progress: p2, earned };
}

export function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    color: ['#5EEAD4','#8FF5D0','#A8AFBD','#F1F5F9','#F08A7C'][Math.floor(Math.random() * 5)],
    size: Math.random() * 8 + 4,
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 8
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 120);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rv;
      p.vy += 0.1;
    });
    frame++;
    if (frame < 140) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  }
  draw();
}

export function showToast(msg, emoji = '⚡', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = `${emoji} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function floatXP(xpAmount, sourceEl) {
  const el = document.createElement('div');
  el.className = 'float-xp';
  el.textContent = `+${xpAmount} XP`;

  // Position near source element or center-screen
  if (sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2 - 40}px`;
    el.style.top  = `${rect.top - 10}px`;
  } else {
    el.style.left = '50%';
    el.style.top  = '60%';
    el.style.transform = 'translateX(-50%)';
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}
