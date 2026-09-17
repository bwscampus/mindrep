// utils/illustrations.js — Custom SVG illustration system
//
// Vanilla, dependency-free, on-brand illustration set for MindRep. Every
// function returns an inline SVG string (same "return HTML string" pattern
// as the rest of the codebase) so it can be dropped straight into template
// literals. Colors reference the CSS custom properties defined in
// style.css (--teal, --purple, --lime, etc.) so illustrations stay in sync
// with the design system automatically.
//
// These are placeholder-grade vector illustrations, not photography. Each
// call site that uses one wraps it in a `.media-slot` container — swap the
// SVG for a real <img>/<video> later by replacing what's inside that div.

let uid = 0;
function nextId(prefix) { uid += 1; return `${prefix}-${uid}`; }

// ============================================================
// Hero illustration — abstract "trained mind" motif.
// Used behind the onboarding headline and the home hero header.
// ============================================================
export function heroIllustration({ size = 220 } = {}) {
  const gradId = nextId('heroGrad');
  const glowId = nextId('heroGlow');
  return `
    <div class="media-slot hero-illustration" style="width:${size}px;height:${size}px;margin:0 auto">
      <svg viewBox="0 0 200 200" width="100%" height="100%" style="overflow:visible">
        <defs>
          <radialGradient id="${gradId}" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.9"/>
            <stop offset="55%" stop-color="var(--purple)" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="var(--purple)" stop-opacity="0"/>
          </radialGradient>
          <filter id="${glowId}" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- orbit ring -->
        <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-dasharray="2 8" class="illo-spin"/>

        <!-- orbiting reps -->
        <g class="illo-spin" style="transform-origin:100px 100px">
          <circle cx="100" cy="14" r="5" fill="var(--lime)" filter="url(#${glowId})"/>
          <circle cx="176" cy="140" r="4" fill="var(--teal)" filter="url(#${glowId})"/>
          <circle cx="30" cy="140" r="4" fill="var(--gold)" filter="url(#${glowId})"/>
        </g>

        <!-- core glow -->
        <circle cx="100" cy="100" r="62" fill="url(#${gradId})"/>

        <!-- mind / lightning glyph -->
        <g filter="url(#${glowId})">
          <path d="M100 54c-22 0-38 16-38 36 0 13 6 21 13 28v10a6 6 0 0 0 6 6h38a6 6 0 0 0 6-6v-10c7-7 13-15 13-28 0-20-16-36-38-36z"
                fill="none" stroke="var(--text)" stroke-width="3" stroke-linejoin="round" opacity="0.9"/>
          <path d="M104 70l-16 22h12l-8 20 22-26h-13l7-16z" fill="var(--lime)" stroke="none"/>
        </g>
      </svg>
    </div>
  `;
}

// ============================================================
// Module icons — one per module, matching each module's theme.
// Replaces the plain emoji badge on module cards.
// ============================================================
const MODULE_ICON_PATHS = {
  // 1 — The Mental Game Begins: brain + spark
  1: (c) => `
    <path d="M16 6c-5 0-9 4-9 9 0 3 1.5 5.5 3.5 7v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3c2-1.5 3.5-4 3.5-7 0-5-4-9-9-9z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M17 12l-4.5 6h3l-2 5 6-7h-3.5l1-4z" fill="${c}"/>
  `,
  // 2 — It Takes What It Takes: raised fist
  2: (c) => `
    <path d="M11 14V9.5a1.5 1.5 0 0 1 3 0V13" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M14 13V8.5a1.5 1.5 0 0 1 3 0V13" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M17 13V9.5a1.5 1.5 0 0 1 3 0V16" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M8 16.5V13a1.5 1.5 0 0 1 3-.3" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M8 16.5c0 5 3.5 7.5 8 7.5s6-3 6-7v-1" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  // 3 — Control the Controllables: target
  3: (c) => `
    <circle cx="16" cy="16" r="9" fill="none" stroke="${c}" stroke-width="1.8"/>
    <circle cx="16" cy="16" r="5" fill="none" stroke="${c}" stroke-width="1.8"/>
    <circle cx="16" cy="16" r="1.6" fill="${c}"/>
  `,
  // 4 — Power of Language: speech bubble with waves
  4: (c) => `
    <path d="M7 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H9a2 2 0 0 1-2-2z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M11 12.5h10M11 16h6" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
  `,
  // 5 — Consistency Beats Motivation: flame
  5: (c) => `
    <path d="M16 6c1 3-2 4-2 7a3 3 0 0 0 6 0c1.5 2 2 4 2 6a6 6 0 1 1-12 0c0-4 2-5 3-8 .5 1.5 1.5 2 3-5z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>
  `,
  // 6 — Game-Day Application: pennant / stadium flag
  6: (c) => `
    <path d="M10 26V7" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 8l13 4-13 4z" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>
  `,
  // 7 — Your Mental Playbook: clipboard
  7: (c) => `
    <rect x="9" y="7" width="14" height="19" rx="2" fill="none" stroke="${c}" stroke-width="1.8"/>
    <rect x="13" y="5" width="6" height="4" rx="1.2" fill="${c}"/>
    <path d="M12 15h8M12 19h8M12 23h5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
  `
};

export function moduleIcon(moduleId, color = 'var(--text)', size = 32) {
  const path = MODULE_ICON_PATHS[moduleId] ? MODULE_ICON_PATHS[moduleId](color) : MODULE_ICON_PATHS[1](color);
  return `
    <svg class="media-slot module-icon" width="${size}" height="${size}" viewBox="0 0 32 32" style="flex-shrink:0">
      ${path}
    </svg>
  `;
}

// ============================================================
// Coach Neutral avatar — geometric face standing in for the 🤖 emoji.
// The flat "neutral" mouth line is a deliberate nod to Neutral Thinking.
// ============================================================
export function coachAvatar({ size = 52 } = {}) {
  const gradId = nextId('coachGrad');
  return `
    <div class="media-slot coach-avatar" style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--purple));display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:var(--shadow-teal)">
      <svg width="${Math.round(size * 0.56)}" height="${Math.round(size * 0.56)}" viewBox="0 0 32 32">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#E2F9FF"/>
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="13" fill="none" stroke="url(#${gradId})" stroke-width="1.6" stroke-dasharray="3 3" opacity="0.6"/>
        <circle cx="11" cy="14" r="2" fill="url(#${gradId})"/>
        <circle cx="21" cy="14" r="2" fill="url(#${gradId})"/>
        <line x1="10" y1="21" x2="22" y2="21" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

// ============================================================
// Sport icons — light line-art supplementing (not replacing) the emoji
// used in the onboarding sport picker.
// ============================================================
const SPORT_ICON_PATHS = {
  soccer:     (c) => `<circle cx="16" cy="16" r="10" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M16 9l5 3.5-2 6h-6l-2-6z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>`,
  basketball: (c) => `<circle cx="16" cy="16" r="10" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M6 16h20M16 6v20M9 8c4 4 4 16 0 20M23 8c-4 4-4 16 0 20" stroke="${c}" stroke-width="1.2" fill="none"/>`,
  football:   (c) => `<ellipse cx="16" cy="16" rx="10" ry="6.5" fill="none" stroke="${c}" stroke-width="1.6" transform="rotate(-30 16 16)"/><path d="M11 16h10M13 13.5l1 1M13 18.5l1-1M19 13.5l-1 1M19 18.5l-1-1" stroke="${c}" stroke-width="1.2" transform="rotate(-30 16 16)"/>`,
  baseball:   (c) => `<circle cx="16" cy="16" r="10" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M9 9c3 3 3 11 0 14M23 9c-3 3-3 11 0 14" stroke="${c}" stroke-width="1.2" fill="none"/>`,
  volleyball: (c) => `<circle cx="16" cy="16" r="10" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M16 6c4 4 4 16 0 20M6 13c5 2 15 2 20 0M6 19c5-2 15-2 20 0" stroke="${c}" stroke-width="1.2" fill="none"/>`,
  swimming:   (c) => `<circle cx="16" cy="10" r="3" fill="${c}"/><path d="M5 20c2 2 4 2 6 0s4-2 6 0 4 2 6 0 4-2 6 0M5 25c2 2 4 2 6 0s4-2 6 0 4 2 6 0 4-2 6 0" stroke="${c}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  track:      (c) => `<path d="M8 24c6 0 4-6 9-6h7" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="19" cy="9" r="2.4" fill="${c}"/><path d="M17 12l1 5-5 3M18 17l4 1 2 5" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  tennis:     (c) => `<circle cx="14" cy="12" r="7" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M9 8c3 2 3 8 0 8M19 8c-3 2-3 8 0 8" stroke="${c}" stroke-width="1" fill="none"/><path d="M18.5 16.5L25 23" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  wrestling:  (c) => `<circle cx="12" cy="12" r="4" fill="none" stroke="${c}" stroke-width="1.6"/><circle cx="20" cy="12" r="4" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M8 22c1-4 3-6 8-6s7 2 8 6" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  gymnastics: (c) => `<circle cx="16" cy="8" r="2.4" fill="${c}"/><path d="M16 10v6M16 16l-6 6M16 16l6 6M11 12l5 2 5-2" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  lacrosse:   (c) => `<path d="M10 26L22 6" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/><path d="M18 6a4 4 0 1 1 4 6l-4-6z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 8l2 2M20 6.5l1.5 3" stroke="${c}" stroke-width="1" fill="none"/>`,
  other:      (c) => `<circle cx="16" cy="13" r="7" fill="none" stroke="${c}" stroke-width="1.6"/><path d="M12 19l-2 8 6-3 6 3-2-8" stroke="${c}" stroke-width="1.4" fill="none" stroke-linejoin="round"/>`
};

export function sportIcon(sportId, color = 'var(--text)', size = 22) {
  const path = SPORT_ICON_PATHS[sportId] || SPORT_ICON_PATHS.other;
  return `<svg class="media-slot sport-icon" width="${size}" height="${size}" viewBox="0 0 32 32" style="flex-shrink:0">${path(color)}</svg>`;
}

// ============================================================
// Canvas variant of the hero mind/lightning glyph — used by the
// achievements share-card (generateShareCard draws to a <canvas>,
// where inline SVG / CSS custom properties aren't available, so this
// draws the same motif with the Canvas 2D API instead).
// ============================================================
export function drawMindGlyph(ctx, cx, cy, r, { glowOpacity = 0.05, strokeOpacity = 0.5, boltColor = 'rgba(94,234,212,0.5)' } = {}) {
  ctx.save();

  // soft radial glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, `rgba(94,234,212,${glowOpacity * 1.4})`);
  grad.addColorStop(0.6, `rgba(168,175,189,${glowOpacity})`);
  grad.addColorStop(1, 'rgba(168,175,189,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // brain outline (rounded blob approximation)
  ctx.strokeStyle = `rgba(255,255,255,${strokeOpacity})`;
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.62, r * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  // lightning bolt
  const s = r * 0.5;
  ctx.fillStyle = boltColor;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, cy - s * 0.6);
  ctx.lineTo(cx - s * 0.35, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.05, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.65);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.1, cy - s * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
