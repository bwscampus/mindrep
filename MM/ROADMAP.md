# MindRep — Product & Technical Roadmap

This is the working plan for turning the MindRep prototype into the product described
in the BCIL independent-study proposal. It's scoped to what's actually true of the
codebase, updated as of the redesign/bug-fix pass on 2026-07-31.

## Current State

**Stack**: Vanilla HTML/CSS/JS, no build step, no framework, no backend. Everything —
user profile, XP, streaks, badges, journal entries, chat history — lives in
`localStorage` on a single device/browser. There is no way to log in on a second
device and see the same progress.

**Content**: Modules 1–3 (9 lessons) are fully built — hook, instruction, activity,
quiz, and tie-in sections for each, per the schema in `data/lessons.js`. Modules 4–7
(12 lessons) exist only as titles; opening one shows a "Coming Soon" stub.

**Business model** (per the BCIL proposal): freemium — Modules 1–3 free, Modules 4–7 +
AI Coach + schedule sync + full tracking behind a `MindRep+` paid tier ($20–30/mo).

**Fixed in this pass** (see git history / diff for specifics):
- Modules 2 & 3 were flagged `locked: true` despite being fully written, so real users
  hit a dead end after 3 lessons. Now unlocked to match the actual free tier.
- Demo/admin mode (`utils/admin.js`, 5-tap trigger in Achievements) could visually
  unlock locked modules but the click handlers weren't attached — dead clicks. Fixed.
- "Upgrade to Premium" was a dead button. It now opens a waitlist modal that stores an
  email in `localStorage` (`waitlist_email`) — not a real payment flow, see Phase 3.
- Sample trend charts on the Tracker screen displayed identical placeholder data for
  two different charts. Game-log emoji was hardcoded to ⚽ regardless of the athlete's
  actual sport. Game reminders only ever showed an in-app banner, never a system
  notification, even with permission granted — now fires a real `Notification` when
  the tab is open (see "Known limitations" below for why "closed app" reminders need
  a backend).
- Renamed "Admin Access" → "Demo Mode" in the UI so it's not presented as real
  security — it isn't; the passphrase ships in plaintext client-side JS
  (`utils/admin.js`) and always will unless gating logic and content genuinely live
  server-side. See Phase 3.

**Visual design**: Added `utils/illustrations.js` — a set of custom inline-SVG
illustrations (hero motif, per-module icons, Coach Neutral avatar, sport icons) themed
off the existing dark "ESPN meets Duolingo" design system in `style.css`. These are
placeholder-grade vector illustrations, not photography — every insertion point is
wrapped in a `.media-slot` div so real photos/video (Jordan's own golf footage,
teammate photos, etc.) can drop in later without restructuring the screens.

## Known Limitations (by design, for now)

These are honest gaps in a client-only prototype, not bugs to "fix" without more
infrastructure:

- **No accounts / no cross-device sync.** Clearing browser data wipes all progress.
  The proposal's "SYNC" pillar (schedule-aware content) fundamentally needs a backend
  to store a user's calendar and push content on a schedule — a static webpage can't
  do this on its own.
- **No real push notifications.** `Notification` only fires while the app tab is open
  in a browser. Actually reminding someone when the app/browser is closed requires a
  service worker + push subscription + a server to trigger the push.
- **AI Coach isn't AI.** `COACH_RESPONSES` in `data/lessons.js` is keyword-matched
  canned text, not an LLM call. Fine for a free-tier taste; the proposal's "AI Coach"
  as a paid differentiator needs a real model integration.
- **No real payments.** The waitlist modal collects an email in `localStorage`; there's
  no Stripe/payment processor wired up.
- **Demo mode isn't security.** Client-side code can never truly hide a secret. Fine
  for showing yourself/beta testers the full app; don't rely on it to gate anything
  that actually needs to stay behind a paywall once there are real paying users.

## Phase 1 — MVP Polish (now)

- [x] Fix free-tier gating so Modules 1–3 are actually reachable (this pass)
- [x] Fix the dead Premium CTA, sample-chart bug, sport-emoji bug, demo-mode framing
- [x] Illustration system + "new look" pass across onboarding/home/modules/lesson/coach/share-card
- [ ] Click through the whole app end-to-end as a brand-new user (onboarding → all 9
      free lessons → practice tools → tracker → achievements) and fix anything that
      breaks
- [ ] Recruit the 25 beta athletes described in the proposal; the free tier (Modules
      1–3) is now actually usable for them

## Phase 2 — Content (Modules 4–7)

Write the remaining 12 lessons using the existing schema in `data/lessons.js` as the
template (each lesson = `hook` → `instruction` → `activity` → `quiz` → `tiein`
sections, matching Modules 1–3's structure exactly). Suggested order, following the
module titles already staged in the data file:
1. Module 4 — Power of Language (clean self-talk, victory chant, team communication)
2. Module 5 — Consistency Beats Motivation (habit-building, daily routine)
3. Module 6 — Game-Day Application (pre-game, in-game recovery, post-game mindset)
4. Module 7 — Your Mental Playbook (capstone/consolidation)

These stay gated behind `MindRep+` per the business model — don't flip their `locked`
flags the way Modules 2/3 were fixed today, since that would give away the entire
paid tier for free.

## Phase 3 — Real Product Infrastructure

The things that can't be faked client-side, roughly in the order they unblock each
other:
1. **Backend + accounts** — even a lightweight one (e.g. a small hosted DB + auth)
   to enable cross-device progress and make gating real instead of client-side-fakeable
2. **Real payments** — Stripe (or similar) checkout for MindRep+, replacing today's
   waitlist-email placeholder
3. **Schedule sync** — the proposal's actual differentiator: let athletes input
   practice/game days, and drive which content surfaces based on proximity to a
   competition. Needs the backend from step 1.
4. **Real push notifications** — service worker + web push, so reminders work even
   when the app isn't open
5. **Real AI Coach** — swap `COACH_RESPONSES` keyword-matching for an actual LLM call
   (with the Moad framework as a system prompt / grounding context), gated to
   MindRep+ per the business model
6. **Coach/parent dashboard** — read-only view into an athlete's consistency and
   confidence trends, as described in the proposal's TRACK pillar

## Verification Checklist

Run `python3 -m http.server 8080` from `/Users/jordan/Desktop/MM` and click through:
- Onboarding (name → sport → age) with the new hero illustration
- Home hero + module-journey cards (icons render, Modules 2 & 3 show as unlocked)
- Modules screen: Modules 1–3 open and their lessons are clickable; Modules 4–7 show
  "Unlocks with MindRep+"; tapping "Upgrade to Premium" opens the waitlist modal
- A full lesson play-through (hook illustration banner → instruction → activity →
  quiz → tie-in → completion screen with confetti/badges)
- Practice Hub: breathing timer, checklist, visualizations, and Coach Neutral (avatar
  should now be an illustrated icon, not 🤖)
- Tracker: log an entry, confirm the correct sport emoji appears in History, and that
  the two placeholder Trends charts show different sample data before 3 real entries
  exist
- Achievements: share-card download/share still works with the new illustrated
  flourish; Demo Mode 5-tap trigger unlocks everything including previously-dead
  lesson clicks in locked modules
