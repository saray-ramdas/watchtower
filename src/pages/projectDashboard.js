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

const settingsIcon = `
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M16.2 10a6.2 6.2 0 0 0-.1-1.1l1.5-1.2-1.6-2.7-1.8.7a6.2 6.2 0 0 0-1.9-1.1L11.7 3h-3.4l-.6 1.6a6.2 6.2 0 0 0-1.9 1.1l-1.8-.7-1.6 2.7L3.9 8.9a6.2 6.2 0 0 0 0 2.2l-1.5 1.2 1.6 2.7 1.8-.7a6.2 6.2 0 0 0 1.9 1.1l.6 1.6h3.4l.6-1.6a6.2 6.2 0 0 0 1.9-1.1l1.8.7 1.6-2.7-1.5-1.2c.1-.4.1-.8.1-1.1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>
`;

const auditIcon = `
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M3 4.5h14M3 8h14M3 11.5h10M3 15h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;

const plusIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`;

const pauseIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="4.5" y="3" width="2.6" height="10" rx="0.7" fill="currentColor"/>
    <rect x="8.9" y="3" width="2.6" height="10" rx="0.7" fill="currentColor"/>
  </svg>
`;

const playIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M5 3.2v9.6c0 .6.7.9 1.2.6l7.5-4.8c.5-.3.5-1 0-1.2L6.2 2.6c-.5-.3-1.2 0-1.2.6Z" fill="currentColor"/>
  </svg>
`;

const docsIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 2.5h6.5l3 3V13a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M10 2.5V6h3.5M6 8.5h4M6 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const testIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 2.5h9M5 2.5v3.7l-2.4 5.1a1 1 0 0 0 .9 1.4h8.9a1 1 0 0 0 .9-1.4L11 6.2V2.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="7.5" cy="10" r="0.8" fill="currentColor"/>
    <circle cx="9.5" cy="11.5" r="0.6" fill="currentColor"/>
  </svg>
`;

const closeIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>
`;

const copyIcon = `
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <rect x="5.5" y="2.5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
    <path d="M10.5 13.5h-7a1 1 0 0 1-1-1v-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
`;

const checkSm = `
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const shieldIcon = `
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M24 5 8 11v12c0 9.2 6.6 17.5 16 20 9.4-2.5 16-10.8 16-20V11l-16-6Z" fill="url(#sg)"/>
    <path d="m16 24 6 6 12-12" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
      <linearGradient id="sg" x1="8" y1="5" x2="40" y2="43">
        <stop offset="0" stop-color="#2684FF"/>
        <stop offset="1" stop-color="#0052CC"/>
      </linearGradient>
    </defs>
  </svg>
`;

const PROVIDER_NAMES = {
  anthropic: 'Anthropic', openai: 'OpenAI', 'google-vertex': 'Google Vertex AI',
  'aws-bedrock': 'AWS Bedrock', 'azure-openai': 'Azure OpenAI', mistral: 'Mistral AI',
  cohere: 'Cohere', xai: 'xAI', groq: 'Groq', databricks: 'Databricks',
  fireworks: 'Fireworks AI', together: 'Together AI', deepseek: 'DeepSeek', perplexity: 'Perplexity',
};

const PROVIDER_MODEL_HINT = {
  anthropic: 'claude-sonnet-4-6', openai: 'gpt-4.1', 'google-vertex': 'gemini-2.5-pro',
  'aws-bedrock': 'anthropic.claude-sonnet-4-6', 'azure-openai': 'gpt-4.1',
  mistral: 'mistral-large-latest', cohere: 'command-r-plus', xai: 'grok-3',
  groq: 'llama-3.3-70b-versatile', databricks: 'databricks-meta-llama-3-1-405b-instruct',
  fireworks: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  deepseek: 'deepseek-chat', perplexity: 'sonar-pro',
};

function maskKey(key) {
  if (!key || key.length < 12) return key;
  return key.slice(0, 8) + '•'.repeat(Math.max(0, key.length - 8));
}

function colorizePython(src) {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const pattern = /(#[^\n]*)|("[^"\n]*"|'[^'\n]*')|\b(from|import|def|return|as|None|True|False)\b|\b([A-Z][A-Za-z0-9_]+)\b/g;
  return esc(src).replace(pattern, (m, c, s, k, t) => {
    if (c) return `<span class="tk-c">${c}</span>`;
    if (s) return `<span class="tk-s">${s}</span>`;
    if (k) return `<span class="tk-k">${k}</span>`;
    if (t) return `<span class="tk-t">${t}</span>`;
    return m;
  });
}

function colorizeBash(src) {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const pattern = /(#[^\n]*)|('[^'\n]*'|"[^"\n]*")|(^|\s)(curl|-H|-d|-X)\b/g;
  return esc(src).replace(pattern, (m, c, s, lead, kw) => {
    if (c) return `<span class="tk-c">${c}</span>`;
    if (s) return `<span class="tk-s">${s}</span>`;
    if (kw) return `${lead}<span class="tk-k">${kw}</span>`;
    return m;
  });
}

export async function renderProjectDashboard(root, { navigate, projectId }) {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;

  let project, endpoints, stats;
  try {
    [project, endpoints, stats] = await Promise.all([
      api.getProject(projectId),
      api.listEndpoints(projectId),
      api.getProjectStats(projectId).catch(() => ({
        total_requests: 0, total_blocked: 0, total_entities_masked: 0, total_tokens: 0,
      })),
    ]);
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('credentials')) {
      auth.clear();
      navigate('/login');
      return;
    }
    root.innerHTML = `
      <div class="auth-shell"><div class="auth-container"><div class="auth-card">
        <h1 class="auth-title">Project not found</h1>
        <p class="auth-subtitle">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary" id="back-home">Back to projects</button>
      </div></div></div>`;
    root.querySelector('#back-home').addEventListener('click', () => navigate('/'));
    return;
  }

  const user = auth.getUser();
  root.innerHTML = renderShell({ user, project, endpoints, stats });
  mount(root, { project, endpoints, navigate });
}

function renderShell({ user, project, endpoints, stats }) {
  const hasEndpoints = endpoints.length > 0;
  const hasUsage = (stats?.total_requests || 0) + (stats?.total_entities_masked || 0) > 0;

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
            <span>${escapeHtml(project.name)}</span>
          </nav>
        </div>
        <div class="home-nav-actions">
          <div class="user-chip">
            <div class="user-avatar">${initials(user?.name)}</div>
            <span class="user-name">${escapeHtml(user?.name || 'User')}</span>
          </div>
        </div>
      </nav>

      <div class="dash-container">
        <header class="dash-header">
          <div class="dash-header-left">
            <p class="eyebrow">Dashboard</p>
            <div class="dash-title-row">
              <h1 class="dash-title">${escapeHtml(project.name)}</h1>
              ${project.is_paused ? '<span class="paused-pill paused-pill-lg"><span class="paused-dot"></span>Paused</span>' : ''}
            </div>
            ${project.description ? `<p class="dash-sub">${escapeHtml(project.description)}</p>` : ''}
          </div>
          <div class="dash-header-actions">
            <button class="dash-audit-btn" id="dash-audit">
              ${auditIcon}<span>Audit Log</span>
            </button>
            <button class="dash-icon-btn" id="dash-settings" aria-label="Settings" title="Settings">
              ${settingsIcon}
            </button>
            <button class="dash-pause-btn${project.is_paused ? ' is-paused' : ''}" id="dash-toggle-pause">
              ${project.is_paused ? playIcon : pauseIcon}
              <span>${project.is_paused ? 'Resume project' : 'Pause project'}</span>
            </button>
            <button class="btn btn-primary dash-new-btn" id="dash-new-endpoint">
              ${plusIcon}<span>New endpoint</span>
            </button>
          </div>
        </header>

        ${project.is_paused ? pausedBanner() : ''}
        ${kpiStrip(stats)}
        ${hasEndpoints && !hasUsage ? emptyTrafficHero(endpoints) : ''}
        ${!hasEndpoints ? emptyEndpointsHero() : ''}
        ${hasEndpoints ? endpointsPanel(endpoints, project) : ''}
      </div>
    </div>
  `;
}

function pausedBanner() {
  return `
    <div class="dash-banner">
      <div class="dash-banner-icon">${pauseIcon}</div>
      <div class="dash-banner-body">
        <strong>Project paused</strong>
        <span>All endpoints are refusing traffic. Resume to continue routing.</span>
      </div>
    </div>
  `;
}

function kpiStrip(stats) {
  const s = stats || { total_requests: 0, total_blocked: 0, total_entities_masked: 0, total_tokens: 0 };
  const fmt = (n) => {
    const v = Number(n) || 0;
    if (v === 0) return '—';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toLocaleString();
  };
  const tiles = [
    {
      label: 'Total requests',
      value: fmt(s.total_requests),
      hint: s.total_requests > 0 ? 'Across all endpoints' : 'Awaiting traffic',
    },
    {
      label: 'Entities masked',
      value: fmt(s.total_entities_masked),
      hint: 'PII redactions',
    },
    {
      label: 'Blocked',
      value: fmt(s.total_blocked),
      hint: s.total_blocked > 0 ? 'Policy or pause' : 'None blocked',
    },
    {
      label: 'Total tokens',
      value: fmt(s.total_tokens),
      hint: 'Prompt + completion',
    },
  ];
  return `
    <section class="kpi-strip">
      ${tiles.map((t) => `
        <div class="kpi-tile">
          <div class="kpi-tile-label">${t.label}</div>
          <div class="kpi-tile-value">${t.value}</div>
          <div class="kpi-tile-hint">${t.hint}</div>
        </div>
      `).join('')}
    </section>
  `;
}

function emptyTrafficHero(endpoints) {
  return `
    <section class="dash-empty">
      <div class="dash-empty-bg"></div>
      <div class="dash-empty-mark">
        <div class="pulse-ring"></div>
        <div class="pulse-ring" style="animation-delay:.6s"></div>
        ${shieldIcon}
      </div>
      <h2 class="dash-empty-title">No usage yet</h2>
      <p class="dash-empty-sub">
        When traffic hits your endpoints, this dashboard fills with real-time
        metrics on requests, masking, blocks, and spend.
      </p>
      <div class="dash-empty-pills">
        <span class="ready-pill"><span class="ready-dot"></span>${endpoints.length} endpoint${endpoints.length === 1 ? '' : 's'} live</span>
        <span class="ready-pill"><span class="ready-dot"></span>Compliance armed</span>
        <span class="ready-pill"><span class="ready-dot"></span>Cluster routing</span>
      </div>
    </section>
  `;
}

function emptyEndpointsHero() {
  return `
    <section class="dash-empty">
      <div class="dash-empty-bg"></div>
      <div class="dash-empty-mark">${shieldIcon}</div>
      <h2 class="dash-empty-title">No endpoints yet</h2>
      <p class="dash-empty-sub">
        Configure your first endpoint to deploy a perimeter — compliance, providers,
        and budget — then point your LangGraph workflow at it.
      </p>
      <button class="btn btn-primary" id="dash-create-first">
        ${plusIcon}<span>Configure first endpoint</span>
      </button>
    </section>
  `;
}

function endpointsPanel(endpoints, project) {
  return `
    <section class="dash-panel">
      <header class="dash-panel-head">
        <div>
          <h2 class="dash-panel-title">Endpoints</h2>
          <p class="dash-panel-sub">${endpoints.length} perimeter${endpoints.length === 1 ? '' : 's'} configured.</p>
        </div>
      </header>
      <div class="ep-list">
        ${endpoints.map((e) => endpointRow(e, project)).join('')}
      </div>
    </section>
  `;
}

const LOCAL_PROXY_BASE = 'http://127.0.0.1:8888';

function endpointRow(e, project) {
  const cfg = e.config || {};
  const baseUrl = cfg.base_url || '';
  const localUrl = `${LOCAL_PROXY_BASE}/v1/${e.perimeter_id}`;
  const apiKey = cfg.api_key || '';
  const providers = Array.isArray(cfg.providers) ? cfg.providers.filter((p) => p.key) : [];
  const compliance = Array.isArray(cfg.compliance) ? cfg.compliance : [];
  const budget = cfg.budget || {};
  const dailyBudget = budget.daily_usd != null ? `$${Number(budget.daily_usd).toLocaleString()}` : '—';
  const providerNames = providers.map((p) => PROVIDER_NAMES[p.provider] || p.provider);

  const projectPaused = !!project?.is_paused;
  const effectivelyPaused = projectPaused || e.is_paused;
  const statusLabel = projectPaused
    ? 'Paused by project'
    : (e.is_paused ? 'Paused' : 'Live');
  const statusClass = effectivelyPaused ? 'ep-status ep-status-paused' : 'ep-status';
  const pauseLabel = e.is_paused ? 'Resume' : 'Pause';
  const pauseGlyph = e.is_paused ? playIcon : pauseIcon;
  const masked = maskKey(apiKey);

  return `
    <article class="ep-card${effectivelyPaused ? ' is-paused' : ''}" data-ep="${e.id}">
      <div class="ep-card-top">
        <div class="ep-card-left">
          <div class="ep-card-titlebar">
            <h3 class="ep-card-title">${escapeHtml(e.name)}</h3>
            <span class="${statusClass}">
              <span class="ep-status-dot"></span>${statusLabel}
            </span>
          </div>
          <code class="ep-perimeter">${escapeHtml(e.perimeter_id)}</code>
        </div>
      </div>

      <div class="ep-creds">
        <div class="ep-cred-row">
          <span class="ep-cred-label">Production</span>
          <code class="ep-cred-value">${escapeHtml(baseUrl)}</code>
          <button class="ob-copy-btn" data-copy-text="${escapeHtml(baseUrl)}">${copyIcon}<span>Copy</span></button>
        </div>
        <div class="ep-cred-row">
          <span class="ep-cred-label">
            Local dev
            <span class="ep-cred-pulse" title="Live on this host"></span>
          </span>
          <code class="ep-cred-value">${escapeHtml(localUrl)}</code>
          <button class="ob-copy-btn" data-copy-text="${escapeHtml(localUrl)}">${copyIcon}<span>Copy</span></button>
        </div>
        <div class="ep-cred-row">
          <span class="ep-cred-label">API key</span>
          <code class="ep-cred-value ep-key-code" data-full="${escapeHtml(apiKey)}" data-masked="${escapeHtml(masked)}">${escapeHtml(masked)}</code>
          <button class="ob-reveal-btn" data-reveal>Show</button>
          <button class="ob-copy-btn" data-copy-text="${escapeHtml(apiKey)}">${copyIcon}<span>Copy</span></button>
        </div>
      </div>

      <div class="ep-meta">
        <div class="ep-meta-item">
          <span class="ep-meta-label">Compliance</span>
          <span class="ep-meta-value">${compliance.length} pack${compliance.length === 1 ? '' : 's'}</span>
        </div>
        <div class="ep-meta-divider"></div>
        <div class="ep-meta-item">
          <span class="ep-meta-label">Providers</span>
          <span class="ep-meta-value">${providerNames.length ? escapeHtml(providerNames.join(' · ')) : '—'}</span>
        </div>
        <div class="ep-meta-divider"></div>
        <div class="ep-meta-item">
          <span class="ep-meta-label">Daily budget</span>
          <span class="ep-meta-value">${dailyBudget}${budget.hard_cap ? ' <span class="ep-tag">hard cap</span>' : ''}</span>
        </div>
      </div>

      <div class="ep-actions">
        <button class="ep-action-btn ep-action-test" data-test="${e.id}">${testIcon}<span>Test endpoint</span></button>
        <button class="ep-action-btn" data-docs="${e.id}">${docsIcon}<span>View docs</span></button>
        <button
          class="ep-action-btn ep-action-pause"
          data-pause-ep="${e.id}"
          ${projectPaused ? 'disabled title="Project is paused"' : ''}
        >
          ${pauseGlyph}<span>${pauseLabel}</span>
        </button>
      </div>
    </article>
  `;
}

function mount(root, { project, endpoints, navigate }) {
  root.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.getAttribute('href'));
    });
  });

  const newBtn = root.querySelector('#dash-new-endpoint');
  if (newBtn) newBtn.addEventListener('click', () => navigate(`/projects/${project.id}/onboarding`));

  const firstBtn = root.querySelector('#dash-create-first');
  if (firstBtn) firstBtn.addEventListener('click', () => navigate(`/projects/${project.id}/onboarding`));

  const settingsBtn = root.querySelector('#dash-settings');
  if (settingsBtn) settingsBtn.addEventListener('click', () => navigate(`/projects/${project.id}/settings`));

  const auditBtn = root.querySelector('#dash-audit');
  if (auditBtn) auditBtn.addEventListener('click', () => navigate(`/projects/${project.id}/audit`));

  const pauseBtn = root.querySelector('#dash-toggle-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', async () => {
      const next = !project.is_paused;
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = `<span class="spinner spinner-dark"></span><span>${next ? 'Pausing…' : 'Resuming…'}</span>`;
      try {
        await api.updateProject(project.id, { is_paused: next });
        showToast(root, next ? 'Project paused' : 'Project resumed');
        renderProjectDashboard(root, { navigate, projectId: project.id });
      } catch (err) {
        showToast(root, err.message || 'Could not update project');
        pauseBtn.disabled = false;
      }
    });
  }

  root.querySelectorAll('[data-pause-ep]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-pause-ep'));
      const endpoint = endpoints.find((x) => x.id === id);
      if (!endpoint) return;
      const next = !endpoint.is_paused;
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="spinner spinner-dark"></span><span>${next ? 'Pausing…' : 'Resuming…'}</span>`;
      try {
        await api.updateEndpoint(project.id, id, { is_paused: next });
        showToast(root, next ? `${endpoint.name} paused` : `${endpoint.name} resumed`);
        renderProjectDashboard(root, { navigate, projectId: project.id });
      } catch (err) {
        showToast(root, err.message || 'Could not update endpoint');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  });

  root.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-copy-text');
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = `${checkSm}<span>Copied</span>`;
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 1400);
      } catch { /* blocked */ }
    });
  });

  root.querySelectorAll('[data-reveal]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.parentElement.querySelector('[data-full]');
      if (!code) return;
      const isMasked = code.textContent === code.dataset.masked;
      code.textContent = isMasked ? code.dataset.full : code.dataset.masked;
      btn.textContent = isMasked ? 'Hide' : 'Show';
    });
  });

  root.querySelectorAll('[data-docs]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-docs'));
      const ep = endpoints.find((x) => x.id === id);
      if (ep) openDocsModal(ep);
    });
  });

  root.querySelectorAll('[data-test]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-test'));
      navigate(`/projects/${project.id}/endpoints/${id}/test`);
    });
  });
}

function openDocsModal(endpoint) {
  const cfg = endpoint.config || {};
  const brandedUrl = cfg.base_url || '';
  const localUrl = `${LOCAL_PROXY_BASE}/v1/${endpoint.perimeter_id}`;
  const apiKey = cfg.api_key || '';
  const providers = (cfg.providers || []).filter((p) => p.key);
  const firstProvider = providers[0]?.provider || 'anthropic';
  const model = PROVIDER_MODEL_HINT[firstProvider] || 'claude-sonnet-4-6';

  // Snippets use the local working URL so copy-paste runs immediately.
  const baseUrl = localUrl;

  const samples = {
    langgraph: {
      label: 'LangGraph', sub: `Python · LangChain ChatOpenAI`,
      lang: 'python',
      code: `# LangGraph node — same SDK, new base URL
# Production: ${brandedUrl}
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}",   # WatchTower key — never your provider key
    model="${model}",      # cluster routes per failover order
)

# Use anywhere in your LangGraph workflow
response = llm.invoke("Summarize the policy doc.")`,
    },
    openai: {
      label: 'OpenAI SDK', sub: 'Python · OpenAI-compatible',
      lang: 'python',
      code: `# Production: ${brandedUrl}
from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}",
)

resp = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Summarize the policy doc."}],
)
print(resp.choices[0].message.content)`,
    },
    curl: {
      label: 'cURL', sub: 'Shell',
      lang: 'bash',
      code: `# Production: ${brandedUrl}
curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "Summarize the policy doc."}
    ]
  }'`,
    },
  };

  const tabIds = ['langgraph', 'openai', 'curl'];
  let activeTab = 'langgraph';

  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop docs-backdrop';
  wrap.innerHTML = `
    <div class="modal-card docs-card" role="dialog" aria-modal="true">
      <header class="docs-head">
        <div>
          <p class="eyebrow">Endpoint docs</p>
          <h2 class="docs-title">Use ${escapeHtml(endpoint.name)}</h2>
          <p class="docs-sub">Drop-in code that points your client at this perimeter.</p>
        </div>
        <button class="docs-close" data-close aria-label="Close">${closeIcon}</button>
      </header>

      <div class="docs-tabs" role="tablist">
        ${tabIds.map((id) => `
          <button class="docs-tab${id === activeTab ? ' is-active' : ''}" data-tab="${id}" role="tab">
            ${samples[id].label}
          </button>
        `).join('')}
      </div>

      <div class="docs-panel">
        <header class="ob-snippet-head docs-snippet-head">
          <div>
            <span class="ob-snippet-eyebrow" id="docs-sub">${samples[activeTab].sub}</span>
            <h3 class="ob-snippet-title" id="docs-label">${samples[activeTab].label}</h3>
          </div>
          <button class="ob-copy-btn" id="docs-copy">${copyIcon}<span>Copy</span></button>
        </header>
        <pre class="ob-code"><code id="docs-code">${samples[activeTab].lang === 'python' ? colorizePython(samples[activeTab].code) : colorizeBash(samples[activeTab].code)}</code></pre>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-open'));

  const close = () => {
    wrap.classList.remove('is-open');
    setTimeout(() => wrap.remove(), 180);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  wrap.querySelector('[data-close]').addEventListener('click', close);

  const codeEl = wrap.querySelector('#docs-code');
  const subEl = wrap.querySelector('#docs-sub');
  const labelEl = wrap.querySelector('#docs-label');

  wrap.querySelectorAll('.docs-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      wrap.querySelectorAll('.docs-tab').forEach((t) => t.classList.toggle('is-active', t === tab));
      const sample = samples[activeTab];
      subEl.textContent = sample.sub;
      labelEl.textContent = sample.label;
      codeEl.innerHTML = sample.lang === 'python' ? colorizePython(sample.code) : colorizeBash(sample.code);
    });
  });

  wrap.querySelector('#docs-copy').addEventListener('click', async () => {
    const btn = wrap.querySelector('#docs-copy');
    try {
      await navigator.clipboard.writeText(samples[activeTab].code);
      const original = btn.innerHTML;
      btn.classList.add('is-copied');
      btn.innerHTML = `${checkSm}<span>Copied</span>`;
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.innerHTML = original;
      }, 1400);
    } catch { /* blocked */ }
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
