// screens/auth.js — sign in, sign up, and password reset.
//
// Rendered before anything else when there is no valid session. Uses the same
// visual language as onboarding so signing in feels like step zero of the app
// rather than a bolted-on gate.

import { api, ApiError } from '../utils/api.js';
import { showToast } from '../utils/gamification.js';
import { heroIllustration } from '../utils/illustrations.js';

const MIN_PASSWORD_LENGTH = 8;

// Interpolated into markup, so it has to be escaped.
function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// fastapi-users answers with machine codes; athletes need sentences.
function friendlyError(error) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  const detail = error.detail || '';
  if (detail.includes('REGISTER_USER_ALREADY_EXISTS')) {
    return 'That email already has an account. Try signing in.';
  }
  if (detail.includes('LOGIN_BAD_CREDENTIALS')) {
    return 'That email and password don\'t match.';
  }
  if (detail.includes('RESET_PASSWORD_BAD_TOKEN')) {
    return 'That reset link has expired or was already used.';
  }
  if (error.status === 429) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (detail.toLowerCase().includes('password')) return detail;
  return detail || 'Something went wrong. Try again.';
}

const inputStyle = `width:100%;background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:16px 18px;color:var(--text);font-size:1rem;font-family:'Outfit',sans-serif;font-weight:600;margin-bottom:12px;transition:border-color .2s`;
const linkStyle = `background:none;border:none;color:var(--teal);font-size:.85rem;font-family:'Inter',sans-serif;cursor:pointer;padding:6px;text-decoration:underline`;

/**
 * @param {(mode: string) => void} onAuthenticated called after a successful
 *        login or registration, once the session cookie is set.
 * @param {string|null} resetToken when present, opens straight to the
 *        "choose a new password" form.
 */
export function renderAuth(onAuthenticated, resetToken = null) {
  const app = document.getElementById('app');
  let mode = resetToken ? 'reset' : 'login';
  let email = '';
  let busy = false;

  function render() {
    app.innerHTML = `<div class="onboard-wrap">${screens[mode]()}</div>`;
    attachEvents();
    document.getElementById('email-input')?.focus();
  }

  const screens = {
    login: () => shell({
      title: 'Welcome back',
      subtitle: 'Sign in to pick up your streak where you left off.',
      fields: `
        <input id="email-input" type="email" autocomplete="email" placeholder="Email" value="${escapeAttr(email)}" style="${inputStyle}" />
        <input id="password-input" type="password" autocomplete="current-password" placeholder="Password" style="${inputStyle}" />
      `,
      submit: 'Sign In →',
      footer: `
        <button id="go-forgot" style="${linkStyle}">Forgot password?</button>
        <div style="margin-top:14px;font-size:.85rem;color:var(--muted)">
          New here? <button id="go-register" style="${linkStyle}">Create an account</button>
        </div>
      `
    }),

    register: () => shell({
      title: 'Create your account',
      subtitle: 'Your progress syncs to your account, so it follows you to any device.',
      fields: `
        <input id="email-input" type="email" autocomplete="email" placeholder="Email" value="${escapeAttr(email)}" style="${inputStyle}" />
        <input id="password-input" type="password" autocomplete="new-password" placeholder="Password (${MIN_PASSWORD_LENGTH}+ characters)" style="${inputStyle}" />
      `,
      submit: 'Create Account →',
      footer: `
        <div style="font-size:.85rem;color:var(--muted)">
          Already have an account? <button id="go-login" style="${linkStyle}">Sign in</button>
        </div>
      `
    }),

    forgot: () => shell({
      title: 'Reset your password',
      subtitle: 'Enter your email and we\'ll send a link to choose a new password.',
      fields: `
        <input id="email-input" type="email" autocomplete="email" placeholder="Email" value="${escapeAttr(email)}" style="${inputStyle}" />
      `,
      submit: 'Send Reset Link →',
      footer: `<button id="go-login" style="${linkStyle}">← Back to sign in</button>`
    }),

    reset: () => shell({
      title: 'Choose a new password',
      subtitle: 'Setting a new password signs you out everywhere else.',
      fields: `
        <input id="password-input" type="password" autocomplete="new-password" placeholder="New password (${MIN_PASSWORD_LENGTH}+ characters)" style="${inputStyle}" />
        <input id="password-confirm" type="password" autocomplete="new-password" placeholder="Confirm new password" style="${inputStyle}" />
      `,
      submit: 'Save Password →',
      footer: `<button id="go-login" style="${linkStyle}">← Back to sign in</button>`
    })
  };

  function shell({ title, subtitle, fields, submit, footer }) {
    return `
      <div style="animation:fadeUp .4s ease;width:100%;max-width:360px;margin:0 auto">
        <div class="onboard-logo">MindRep</div>
        <div style="margin:4px 0 16px">${heroIllustration({ size: 120 })}</div>
        <h2 style="font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:900;margin-bottom:8px">${title}</h2>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:24px;line-height:1.5">${subtitle}</p>
        <form id="auth-form" novalidate>
          ${fields}
          <button id="auth-submit" type="submit" class="btn btn-primary btn-block btn-lg" ${busy ? 'disabled' : ''}>
            ${busy ? 'Working…' : submit}
          </button>
        </form>
        <div style="margin-top:18px">${footer}</div>
      </div>
    `;
  }

  function attachEvents() {
    document.getElementById('auth-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });
    document.getElementById('go-login')?.addEventListener('click', () => switchTo('login'));
    document.getElementById('go-register')?.addEventListener('click', () => switchTo('register'));
    document.getElementById('go-forgot')?.addEventListener('click', () => switchTo('forgot'));
  }

  function switchTo(next) {
    email = document.getElementById('email-input')?.value.trim() || email;
    mode = next;
    render();
  }

  function readEmail() {
    email = document.getElementById('email-input')?.value.trim() || '';
    return email;
  }

  async function submit() {
    if (busy) return;
    const password = document.getElementById('password-input')?.value || '';

    try {
      if (mode === 'login') {
        if (!readEmail() || !password) { showToast('Enter your email and password', '🔑'); return; }
        await run(() => api.login(email, password));
        onAuthenticated('login');
        return;
      }

      if (mode === 'register') {
        if (!readEmail()) { showToast('Enter your email', '📧'); return; }
        if (password.length < MIN_PASSWORD_LENGTH) {
          showToast(`Password needs at least ${MIN_PASSWORD_LENGTH} characters`, '🔒');
          return;
        }
        await run(async () => {
          await api.register(email, password);
          await api.login(email, password);
        });
        onAuthenticated('register');
        return;
      }

      if (mode === 'forgot') {
        if (!readEmail()) { showToast('Enter your email', '📧'); return; }
        await run(() => api.forgotPassword(email));
        // Deliberately the same message either way: confirming which emails
        // have accounts would let anyone probe for members.
        showToast('If that email has an account, a reset link is on its way', '📬', 5000);
        mode = 'login';
        render();
        return;
      }

      if (mode === 'reset') {
        const confirm = document.getElementById('password-confirm')?.value || '';
        if (password.length < MIN_PASSWORD_LENGTH) {
          showToast(`Password needs at least ${MIN_PASSWORD_LENGTH} characters`, '🔒');
          return;
        }
        if (password !== confirm) { showToast('Those passwords don\'t match', '🔒'); return; }
        await run(() => api.resetPassword(resetToken, password));
        clearResetTokenFromUrl();
        showToast('Password updated — sign in with it now', '✅', 4000);
        mode = 'login';
        render();
      }
    } catch (error) {
      showToast(friendlyError(error), '⚠️', 4500);
    }
  }

  async function run(action) {
    busy = true;
    render();
    try {
      await action();
    } finally {
      busy = false;
      render();
    }
  }

  render();
}

/** Strip the token from the address bar so it isn't re-used or shared. */
export function clearResetTokenFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('reset_token');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export function readResetTokenFromUrl() {
  return new URL(window.location.href).searchParams.get('reset_token');
}
