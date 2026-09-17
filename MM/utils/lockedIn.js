// utils/lockedIn.js — "Locked In" mode: the ongoing-habit layer that kicks
// in once an athlete has finished every lesson currently unlocked for them.
//
// Deliberately gate-agnostic: this only asks "is there a next lesson?", not
// "did they pay?". Today that means finishing Modules 1-3 flips it on: when
// Modules 4-7 ship, isLockedIn() naturally pushes back out on its own with no
// code change here. Whether Locked In mode itself ever becomes a paid-tier
// feature is a separate business decision — wire that in at the one call site
// below whenever that decision is made, nothing else has to change.

import { MODULES } from '../data/lessons.js';

export function isLockedIn(progress) {
  const completed = progress?.completedLessons || [];
  for (const mod of MODULES) {
    if (mod.locked) continue;
    for (const lesson of mod.lessons) {
      if (!completed.includes(lesson.id)) return false;
    }
  }
  return true;
}
