import { api, auth } from '../api.js';
import { alertIcon, brandWordmark } from '../ui.js';

export function renderSignup(root, { navigate }) {
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-container">
        ${brandWordmark()}
        <div class="auth-card">
          <div class="setup-badge">
            <span class="setup-badge-dot"></span>
            First-time setup
          </div>
          <h1 class="auth-title">Create your super admin</h1>
          <p class="auth-subtitle">
            No accounts exist yet. Set up the first account to start managing your WatchTower workspace.
          </p>

          <div id="signup-error" hidden></div>

          <form class="auth-form" id="signup-form" novalidate>
            <div class="field">
              <label class="field-label" for="signup-name">Full name</label>
              <input class="field-input" id="signup-name" name="name" type="text" placeholder="Jane Doe" autocomplete="name" required />
            </div>
            <div class="field">
              <label class="field-label" for="signup-email">Work email</label>
              <input class="field-input" id="signup-email" name="email" type="email" placeholder="you@bilvantis.com" autocomplete="email" required />
            </div>
            <div class="field">
              <label class="field-label" for="signup-password">Password</label>
              <input class="field-input" id="signup-password" name="password" type="password" placeholder="Minimum 8 characters" autocomplete="new-password" minlength="8" required />
              <span class="field-hint">Use at least 8 characters.</span>
            </div>
            <button class="btn btn-primary btn-block" type="submit" id="signup-submit">
              <span>Create super admin</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const form = root.querySelector('#signup-form');
  const submit = root.querySelector('#signup-submit');
  const errorBox = root.querySelector('#signup-error');

  const showError = (msg) => {
    errorBox.hidden = false;
    errorBox.className = 'alert';
    errorBox.innerHTML = `${alertIcon}<span>${msg}</span>`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const data = Object.fromEntries(new FormData(form));

    submit.disabled = true;
    submit.innerHTML = `<span class="spinner"></span><span>Creating account…</span>`;

    try {
      const res = await api.signup(data);
      auth.set(res.access_token, res.user);
      navigate('/');
    } catch (err) {
      showError(err.message || 'Could not create account.');
      submit.disabled = false;
      submit.innerHTML = `<span>Create super admin</span>`;
    }
  });
}
