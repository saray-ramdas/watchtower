import { api, auth } from '../api.js';
import { alertIcon, initials, logoMark } from '../ui.js';

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const chevronIcon = `
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="m3 1.5 3 3.5-3 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const keyIcon = `
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <circle cx="6.5" cy="9" r="2.6" stroke="currentColor" stroke-width="1.4"/>
    <path d="M8.8 9H16M13.5 9v2.6M16 9v2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
`;

const userIcon = `
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="6.5" r="3" stroke="currentColor" stroke-width="1.4"/>
    <path d="M2.5 16c.4-3.4 3.4-5 6.5-5s6.1 1.6 6.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
`;

const checkSm = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const eyeIcon = `
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <path d="M1.5 9s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5S1.5 9 1.5 9Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="9" cy="9" r="2.2" stroke="currentColor" stroke-width="1.4"/>
  </svg>
`;

const PROVIDER_NAMES = {
  anthropic: 'Anthropic', openai: 'OpenAI', 'google-vertex': 'Google Vertex AI',
  'aws-bedrock': 'AWS Bedrock', 'azure-openai': 'Azure OpenAI', mistral: 'Mistral AI',
  cohere: 'Cohere', xai: 'xAI', groq: 'Groq', databricks: 'Databricks',
  fireworks: 'Fireworks AI', together: 'Together AI', deepseek: 'DeepSeek', perplexity: 'Perplexity',
};
const PROVIDER_TAGS = {
  anthropic: 'Claude', openai: 'GPT', 'google-vertex': 'Gemini',
  'aws-bedrock': 'Multi-model', 'azure-openai': 'Enterprise OpenAI', mistral: 'Mistral / Codestral',
  cohere: 'Command', xai: 'Grok', groq: 'Fast inference', databricks: 'Foundation Model APIs',
  fireworks: 'Open + fine-tuned', together: 'Open model hosting', deepseek: 'V3 / R1', perplexity: 'Sonar',
};

const SECTIONS = [
  { id: 'llm', label: 'LLM Providers', icon: keyIcon, sub: 'Endpoint API keys' },
  { id: 'owner', label: 'Project Owner', icon: userIcon, sub: 'Ownership & alerts' },
];

export async function renderProjectSettings(root, { navigate, projectId, section }) {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;

  let project, endpoints, users;
  try {
    [project, endpoints, users] = await Promise.all([
      api.getProject(projectId),
      api.listEndpoints(projectId),
      api.listUsers(),
    ]);
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('credentials')) {
      auth.clear();
      navigate('/login');
      return;
    }
    root.innerHTML = `
      <div class="auth-shell"><div class="auth-container"><div class="auth-card">
        <h1 class="auth-title">Could not load settings</h1>
        <p class="auth-subtitle">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary" id="back-home">Back to projects</button>
      </div></div></div>`;
    root.querySelector('#back-home').addEventListener('click', () => navigate('/'));
    return;
  }

  const user = auth.getUser();
  root.innerHTML = shell({ user, project, endpoints, users, section });
  mount(root, { project, endpoints, users, section, navigate });
}

function shell({ user, project, endpoints, users, section }) {
  return `
    <div class="dash-shell">
      <nav class="ob-nav">
        <div class="ob-nav-left">
          <div class="ob-nav-brand">
            ${logoMark(28)}
            <span class="accent">WatchTower</span>
          </div>
          <nav class="ob-breadcrumb" aria-label="Breadcrumb">
            <a href="/" data-link>WatchTower</a>
            ${chevronIcon}
            <a href="/" data-link>Projects</a>
            ${chevronIcon}
            <a href="/projects/${project.id}" data-link>${escapeHtml(project.name)}</a>
            ${chevronIcon}
            <span>Settings</span>
          </nav>
        </div>
        <div class="home-nav-actions">
          <div class="user-chip">
            <div class="user-avatar">${initials(user?.name)}</div>
            <span class="user-name">${escapeHtml(user?.name || 'User')}</span>
          </div>
        </div>
      </nav>

      <div class="settings-container">
        <header class="settings-header">
          <p class="eyebrow">Project Settings</p>
          <h1 class="settings-title">Settings</h1>
          <p class="settings-sub">Manage providers, ownership, and configuration for ${escapeHtml(project.name)}.</p>
        </header>

        <div class="settings-grid">
          <aside class="settings-rail">
            ${SECTIONS.map((s) => `
              <a href="/projects/${project.id}/settings/${s.id}" class="settings-rail-item${s.id === section ? ' is-active' : ''}" data-link>
                <span class="settings-rail-icon">${s.icon}</span>
                <span class="settings-rail-text">
                  <span class="settings-rail-label">${s.label}</span>
                  <span class="settings-rail-sub">${s.sub}</span>
                </span>
                <span class="settings-rail-chev">${chevronIcon}</span>
              </a>
            `).join('')}
          </aside>

          <main class="settings-main" id="settings-main">
            ${section === 'owner'
              ? renderOwnerSection(project, users)
              : renderLLMSection(endpoints)}
          </main>
        </div>
      </div>
    </div>
  `;
}

function renderLLMSection(endpoints) {
  if (!endpoints.length) {
    return `
      <header class="settings-section-head">
        <h2 class="settings-section-title">LLM Providers</h2>
        <p class="settings-section-sub">Configure endpoints first to manage provider keys.</p>
      </header>
      <div class="settings-empty">No endpoints in this project yet.</div>
    `;
  }
  return `
    <header class="settings-section-head">
      <h2 class="settings-section-title">LLM Providers</h2>
      <p class="settings-section-sub">Rotate provider keys per endpoint. Keys are stored as references — never in plaintext.</p>
    </header>
    <div class="settings-endpoint-list">
      ${endpoints.map(endpointLLMCard).join('')}
    </div>
  `;
}

function endpointLLMCard(e) {
  const cfg = e.config || {};
  const providers = Array.isArray(cfg.providers) ? cfg.providers.filter((p) => p.key) : [];
  return `
    <section class="settings-endpoint-card" data-endpoint="${e.id}">
      <header class="settings-ep-head">
        <div>
          <h3 class="settings-ep-title">${escapeHtml(e.name)}</h3>
          <code class="settings-ep-perimeter">${escapeHtml(e.perimeter_id)}</code>
        </div>
        <span class="settings-ep-count">${providers.length} provider${providers.length === 1 ? '' : 's'}</span>
      </header>
      <div class="settings-provider-list">
        ${providers.map((p, i) => providerRow(e, p, i)).join('') || '<p class="settings-empty">No providers configured.</p>'}
      </div>
    </section>
  `;
}

function providerRow(endpoint, p, idx) {
  const name = PROVIDER_NAMES[p.provider] || p.provider;
  const tag = PROVIDER_TAGS[p.provider] || '';
  const rotated = p.rotated_at ? formatDateTime(p.rotated_at) : null;
  return `
    <div class="settings-provider" data-endpoint="${endpoint.id}" data-provider="${escapeHtml(p.provider)}">
      <div class="settings-provider-main">
        <div class="settings-provider-rank">${idx + 1}</div>
        <div class="settings-provider-meta">
          <div class="settings-provider-name">${escapeHtml(name)}</div>
          <div class="settings-provider-tag">${escapeHtml(tag)}</div>
        </div>
        <div class="settings-provider-key" data-role="key-display">
          <code>${escapeHtml(p.key || '••• not configured')}</code>
          ${rotated ? `<span class="settings-rotated">Rotated ${rotated}</span>` : ''}
        </div>
        <button class="ob-copy-btn settings-update-btn" data-role="update">Update key</button>
      </div>
      <div class="settings-provider-edit" data-role="editor" hidden>
        <input type="password" placeholder="Paste new ${escapeHtml(name)} key" data-role="key-input" autocomplete="off" spellcheck="false" />
        <button class="btn-ghost" type="button" data-role="cancel">Cancel</button>
        <button class="btn btn-primary settings-save-btn" type="button" data-role="save">Save key</button>
      </div>
    </div>
  `;
}

function renderOwnerSection(project, users) {
  const current = users.find((u) => u.id === project.owner_id);
  return `
    <header class="settings-section-head">
      <h2 class="settings-section-title">Project Owner</h2>
      <p class="settings-section-sub">The owner receives alerts, incident pages, and budget notifications.</p>
    </header>

    <div class="owner-card">
      <div class="owner-current">
        <div class="owner-avatar">${initials(current?.name || '?')}</div>
        <div class="owner-meta">
          <div class="owner-name">
            ${escapeHtml(current?.name || 'Unknown')}
            ${current?.is_super_admin ? '<span class="role-tag">Super Admin</span>' : ''}
          </div>
          <div class="owner-email">${escapeHtml(current?.email || '')}</div>
        </div>
        <span class="owner-current-pill">Current owner</span>
      </div>

      <div class="owner-divider"></div>

      <div class="owner-assign">
        <label class="field-label" for="owner-select">Assign owner</label>
        <div class="owner-select-row">
          <select class="owner-select" id="owner-select">
            ${users.map((u) => `
              <option value="${u.id}" ${u.id === project.owner_id ? 'selected' : ''}>
                ${escapeHtml(u.name)} · ${escapeHtml(u.email)}
              </option>
            `).join('')}
          </select>
          <button class="btn btn-primary" id="owner-save" disabled>Save changes</button>
        </div>
        <p class="owner-hint">${users.length === 1
          ? 'Only one user exists. Invite teammates to expand ownership options.'
          : `${users.length} users available.`}</p>
      </div>
    </div>
  `;
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function mount(root, { project, endpoints, users, section, navigate }) {
  root.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.getAttribute('href'));
    });
  });

  if (section === 'llm') wireLLM(root, { project, endpoints, navigate });
  if (section === 'owner') wireOwner(root, { project, users, navigate });
}

function wireLLM(root, { project, endpoints, navigate }) {
  root.querySelectorAll('.settings-provider').forEach((row) => {
    const epId = Number(row.dataset.endpoint);
    const providerId = row.dataset.provider;
    const display = row.querySelector('[data-role="key-display"]');
    const editor = row.querySelector('[data-role="editor"]');
    const updateBtn = row.querySelector('[data-role="update"]');
    const cancelBtn = row.querySelector('[data-role="cancel"]');
    const saveBtn = row.querySelector('[data-role="save"]');
    const input = row.querySelector('[data-role="key-input"]');

    const openEditor = () => {
      display.style.display = 'none';
      updateBtn.style.display = 'none';
      editor.hidden = false;
      setTimeout(() => input.focus(), 30);
    };

    const closeEditor = () => {
      display.style.display = '';
      updateBtn.style.display = '';
      editor.hidden = true;
      input.value = '';
    };

    updateBtn.addEventListener('click', openEditor);
    cancelBtn.addEventListener('click', closeEditor);

    saveBtn.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) { input.focus(); return; }
      saveBtn.disabled = true;
      const original = saveBtn.innerHTML;
      saveBtn.innerHTML = `<span class="spinner"></span><span>Saving…</span>`;
      try {
        const updated = await api.updateProviderKey(project.id, epId, providerId, key);
        const newEntry = (updated.config?.providers || []).find((p) => p.provider === providerId);
        if (newEntry) {
          const code = display.querySelector('code');
          code.textContent = newEntry.key || '••• not configured';
          const rotatedSpan = display.querySelector('.settings-rotated');
          const rotatedText = newEntry.rotated_at ? `Rotated ${formatDateTime(newEntry.rotated_at)}` : '';
          if (rotatedSpan) {
            rotatedSpan.textContent = rotatedText;
          } else if (rotatedText) {
            display.insertAdjacentHTML('beforeend', `<span class="settings-rotated">${rotatedText}</span>`);
          }
        }
        showToast(root, 'Key rotated · stored as reference');
        closeEditor();
      } catch (err) {
        showToast(root, err.message || 'Could not rotate key');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = original;
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
      if (e.key === 'Escape') closeEditor();
    });
  });
}

function wireOwner(root, { project, users, navigate }) {
  const select = root.querySelector('#owner-select');
  const save = root.querySelector('#owner-save');
  if (!select) return;

  select.addEventListener('change', () => {
    save.disabled = Number(select.value) === project.owner_id;
  });

  save.addEventListener('click', async () => {
    const newOwnerId = Number(select.value);
    save.disabled = true;
    const original = save.innerHTML;
    save.innerHTML = `<span class="spinner"></span><span>Saving…</span>`;
    try {
      await api.updateProject(project.id, { owner_id: newOwnerId });
      showToast(root, 'Owner updated');
      renderProjectSettings(root, { navigate, projectId: project.id, section: 'owner' });
    } catch (err) {
      showToast(root, err.message || 'Could not update owner');
      save.disabled = false;
      save.innerHTML = original;
    }
  });
}

function showToast(root, message) {
  const existing = document.querySelector('.dash-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'dash-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-open'));
  setTimeout(() => {
    toast.classList.remove('is-open');
    setTimeout(() => toast.remove(), 220);
  }, 1800);
}
