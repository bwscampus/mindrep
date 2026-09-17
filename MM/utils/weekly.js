// utils/weekly.js — Weekly Check-in cadence helpers. One check-in per
// Monday-to-Sunday week, keyed by that week's Monday date so "due" is a
// simple lookup rather than tracked state.

export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.toDateString(); // that Monday's date string, e.g. "Mon Sep 14 2026"
}

export function isWeeklyCheckinDue(progress) {
  const key = getWeekKey();
  return !(progress.weeklyCheckins || []).some(c => c.weekKey === key);
}
