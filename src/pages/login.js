import { api, auth } from '../api.js';
import { alertIcon, brandWordmark } from '../ui.js';

export function renderLogin(root, { navigate }) {
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-container">
        ${brandWordmark('Your one-click governance platform')}
        <div class="auth-card">
          <p class="auth-eyebrow">Sign in</p>
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-subtitle">Enter your credentials to access your WatchTower workspace.</p>

          <div id="login-error" hidden></div>

          <form class="auth-form" id="login-form" novalidate>
            <div class="field">
              <label class="field-label" for="login-email">Email</label>
              <input class="field-input" id="login-email" name="email" type="email" placeholder="you@bilvantis.com" autocomplete="email" required />
            </div>
            <div class="field">
              <label class="field-label" for="login-password">Password</label>
              <input class="field-input" id="login-password" name="password" type="password" placeholder="Enter your password" autocomplete="current-password" required />
            </div>
            <button class="btn btn-primary btn-block" type="submit" id="login-submit">
              <span>Sign in</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const form = root.querySelector('#login-form');
  const submit = root.querySelector('#login-submit');
  const errorBox = root.querySelector('#login-error');

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
    submit.innerHTML = `<span class="spinner"></span><span>Signing in…</span>`;

    try {
      const res = await api.login(data);
      auth.set(res.access_token, res.user);
      navigate('/');
    } catch (err) {
      showError(err.message || 'Invalid email or password.');
      submit.disabled = false;
      submit.innerHTML = `<span>Sign in</span>`;
    }
  });
}
