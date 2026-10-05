// utils/escape.js — make text safe to drop into an HTML template string.
//
// Screens build markup with template literals and assign it to innerHTML.
// Anything the athlete typed (their name, journal answers, coach chat) must
// go through escapeHtml first, or a name like `<img src=x onerror=...>`
// becomes markup. The strict CSP stops inline scripts, but not injected
// HTML/CSS, and once coaches or parents can view an athlete's data this is
// the line between a typo and an account takeover (Production Standard FE-1).
//
// Safe in element content and in double-quoted attribute values.

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
