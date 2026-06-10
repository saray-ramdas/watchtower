import './style.css';
import { api, auth } from './api.js';
import { renderHome } from './pages/home.js';
import { renderLogin } from './pages/login.js';
import { renderProjectAudit } from './pages/projectAudit.js';
import { renderProjectDashboard } from './pages/projectDashboard.js';
import { renderProjectOnboarding } from './pages/projectOnboarding.js';
import { renderProjectSettings } from './pages/projectSettings.js';
import { renderSignup } from './pages/signup.js';
import { renderTestEndpoint } from './pages/testEndpoint.js';

const root = document.querySelector('#app');

function showLoading() {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;
}

function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  route();
}

async function route() {
  showLoading();

  let needsSetup = false;
  try {
    const status = await api.setupStatus();
    needsSetup = status.needs_setup;
  } catch (err) {
    root.innerHTML = `
      <div class="auth-shell"><div class="auth-container">
        <div class="auth-card">
          <h1 class="auth-title">Can't reach the server</h1>
          <p class="auth-subtitle">Make sure the backend is running on port 8888.</p>
        </div>
      </div></div>`;
    return;
  }

  const path = window.location.pathname;
  const isAuthed = !!auth.getToken();

  if (needsSetup) {
    auth.clear();
    if (path !== '/signup') return navigate('/signup');
    return renderSignup(root, { navigate });
  }

  if (!isAuthed) {
    if (path === '/signup') return navigate('/login');
    if (path !== '/login') return navigate('/login');
    return renderLogin(root, { navigate });
  }

  if (path === '/login' || path === '/signup') return navigate('/');

  const onboardingMatch = path.match(/^\/projects\/(\d+)\/onboarding\/?$/);
  if (onboardingMatch) {
    return renderProjectOnboarding(root, { navigate, projectId: Number(onboardingMatch[1]) });
  }

  const settingsMatch = path.match(/^\/projects\/(\d+)\/settings(?:\/([a-z-]+))?\/?$/);
  if (settingsMatch) {
    return renderProjectSettings(root, {
      navigate,
      projectId: Number(settingsMatch[1]),
      section: settingsMatch[2] || 'llm',
    });
  }

  const testMatch = path.match(/^\/projects\/(\d+)\/endpoints\/(\d+)\/test\/?$/);
  if (testMatch) {
    return renderTestEndpoint(root, {
      navigate,
      projectId: Number(testMatch[1]),
      endpointId: Number(testMatch[2]),
    });
  }

  const auditMatch = path.match(/^\/projects\/(\d+)\/audit\/?$/);
  if (auditMatch) {
    return renderProjectAudit(root, { navigate, projectId: Number(auditMatch[1]) });
  }

  const dashboardMatch = path.match(/^\/projects\/(\d+)\/?$/);
  if (dashboardMatch) {
    return renderProjectDashboard(root, { navigate, projectId: Number(dashboardMatch[1]) });
  }

  return renderHome(root, { navigate });
}

window.addEventListener('popstate', route);
route();
