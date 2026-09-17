// data/dailyReps.js — Daily Mental Rep bank for "Locked In" mode.
//
// These aren't new lessons — they're 60-90 second reinforcement reps that
// recycle the concepts Foundations already taught (neutral thinking, the 3R
// reset, ownership, effort, control, process focus, the 90-second rule).
// Each rep reuses an interaction type the app already has UI for, so no new
// components are needed — just content.
//
// type: 'flip'    — a single negative→neutral swipe card (like a lesson's
//                    swipe activity, but one card instead of four)
// type: 'prompt'  — a short written reflection (like a lesson's journal step)
// type: 'breathe' — a framed reminder to run a breathing round, self-marked
//                    done (the actual timer lives in the Practice Hub)

export const DAILY_REPS = [
  { id: "dr01", skill: "Neutral Thinking", type: "flip",
    title: "Flip It Neutral",
    negative: "\"I can't believe I just did that.\"",
    neutral: "\"That happened. Next rep.\"" },
  { id: "dr02", skill: "Control", type: "prompt",
    title: "Name Your Controllables",
    prompt: "Name ONE thing you will control today, no matter what happens." },
  { id: "dr03", skill: "Reset", type: "breathe",
    title: "Reset Breath",
    prompt: "Before you do anything else today, run 2 rounds of box breathing." },
  { id: "dr04", skill: "Effort", type: "prompt",
    title: "The Extra Rep",
    prompt: "What's the ONE extra rep you'll do today that you wouldn't have done yesterday?" },
  { id: "dr05", skill: "Ownership", type: "prompt",
    title: "No Matter What",
    prompt: "Finish this sentence: \"No matter what happens today, I will ___.\"" },
  { id: "dr06", skill: "Neutral Thinking", type: "flip",
    title: "Flip It Neutral",
    negative: "\"Everyone's going to remember this mistake.\"",
    neutral: "\"I'm the only one who controls how long this lasts.\"" },
  { id: "dr07", skill: "Role", type: "prompt",
    title: "Own Your Role",
    prompt: "What's one way you can be the best at YOUR role today — not someone else's?" },
  { id: "dr08", skill: "Process Focus", type: "prompt",
    title: "Your Process Cue",
    prompt: "What's your process cue for today — the phrase you'll say if you catch yourself watching the scoreboard?" },
  { id: "dr09", skill: "Ownership", type: "flip",
    title: "Flip It Neutral",
    negative: "\"The conditions aren't fair.\"",
    neutral: "\"I train for all conditions. I'm built for this.\"" },
  { id: "dr10", skill: "90-Second Rule", type: "prompt",
    title: "Time Your Recovery",
    prompt: "Think of your last mistake in a game or practice. How long did you let it live in your head? Aim for under 90 seconds next time." },
  { id: "dr11", skill: "Effort", type: "flip",
    title: "Flip It Neutral",
    negative: "\"I'm too tired to go hard today.\"",
    neutral: "\"Effort is the one thing I control 100% of the time.\"" },
  { id: "dr12", skill: "Control", type: "prompt",
    title: "Release One Thing",
    prompt: "What's one thing outside your control that you've been holding onto? Write it down — then let it go." },
  { id: "dr13", skill: "Reset", type: "flip",
    title: "Flip It Neutral",
    negative: "\"I don't have time to reset.\"",
    neutral: "\"A reset takes 3 seconds. I always have 3 seconds.\"" },
  { id: "dr14", skill: "Process Focus", type: "flip",
    title: "Flip It Neutral",
    negative: "\"I need to win today.\"",
    neutral: "\"Win this rep. The score follows.\"" },
  { id: "dr15", skill: "Ownership", type: "flip",
    title: "Flip It Neutral",
    negative: "\"It's not my fault we lost.\"",
    neutral: "\"I own my part. What's mine to fix?\"" },
  { id: "dr16", skill: "Role", type: "flip",
    title: "Flip It Neutral",
    negative: "\"My role doesn't matter.\"",
    neutral: "\"Every role executed well moves the team forward.\"" },
  { id: "dr17", skill: "Effort", type: "prompt",
    title: "Rate Your Effort",
    prompt: "Rate your effort yesterday, 1-5. What's one way to push it higher today?" },
  { id: "dr18", skill: "90-Second Rule", type: "breathe",
    title: "Feel It, Then Move",
    prompt: "Feel it for 90 seconds — then ask yourself: what's my next controllable?" },
  { id: "dr19", skill: "Control", type: "prompt",
    title: "Your 3 Controllables",
    prompt: "Before your next practice or game, write your 3 controllables for the day: effort, attitude, and one more." },
  { id: "dr20", skill: "Reset", type: "breathe",
    title: "Pressure Reset",
    prompt: "Feeling tight before something today? 90 seconds of slow breathing resets your nervous system faster than you'd think." },
  { id: "dr21", skill: "Neutral Thinking", type: "flip",
    title: "Flip It Neutral",
    negative: "\"I'm not good enough for this level.\"",
    neutral: "\"I'm building toward this level, one rep at a time.\"" }
];

// Deterministic "today's rep" — same rep for everyone on a given calendar
// day, cycling through the bank. No randomness, no stored index needed.
export function getTodayRep() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return DAILY_REPS[dayIndex % DAILY_REPS.length];
}
