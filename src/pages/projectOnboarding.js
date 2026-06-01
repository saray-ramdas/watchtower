import { api, auth } from '../api.js';
import { alertIcon, initials, logoMark } from '../ui.js';

const COMPLIANCE = [
  {
    region: 'Middle East',
    packs: [
      { id: 'uae-pdpl', name: 'UAE PDPL', description: 'Federal Decree-Law No. 45 of 2021' },
      { id: 'uae-nesa', name: 'UAE IA Standards', description: 'NESA Information Assurance' },
      { id: 'difc-dp', name: 'DIFC Data Protection Law', description: 'DIFC financial free zone' },
      { id: 'adgm-dp', name: 'ADGM Data Protection', description: 'Abu Dhabi Global Market' },
      { id: 'sa-pdpl', name: 'Saudi PDPL', description: 'KSA Personal Data Protection' },
      { id: 'sa-nca-ecc', name: 'NCA ECC', description: 'Essential Cybersecurity Controls' },
      { id: 'sa-sama', name: 'SAMA Cybersecurity', description: 'KSA financial framework' },
      { id: 'qa-nia', name: 'Qatar NIA Policy', description: 'National Information Assurance' },
      { id: 'bh-pdpl', name: 'Bahrain PDPL', description: 'Personal Data Protection Law' },
    ],
  },
  {
    region: 'North America',
    packs: [
      { id: 'hipaa', name: 'HIPAA', description: 'US healthcare privacy & security' },
      { id: 'soc2', name: 'SOC 2 Type II', description: 'Trust Services Criteria' },
      { id: 'pci-dss', name: 'PCI DSS 4.0', description: 'Payment card industry' },
      { id: 'ccpa', name: 'CCPA / CPRA', description: 'California consumer privacy' },
      { id: 'glba', name: 'GLBA', description: 'Gramm-Leach-Bliley Act' },
      { id: 'fedramp', name: 'FedRAMP Moderate', description: 'US federal cloud authorization' },
      { id: 'ferpa', name: 'FERPA', description: 'Student education records' },
      { id: 'nist-csf', name: 'NIST CSF 2.0', description: 'Cybersecurity Framework' },
      { id: 'nist-80053', name: 'NIST 800-53 r5', description: 'Security & Privacy Controls' },
      { id: 'pipeda', name: 'PIPEDA', description: 'Canadian federal privacy' },
      { id: 'quebec-25', name: 'Quebec Law 25', description: 'Quebec privacy reform' },
    ],
  },
  {
    region: 'Europe',
    packs: [
      { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
      { id: 'eu-ai-act', name: 'EU AI Act', description: 'Regulation (EU) 2024/1689' },
      { id: 'dora', name: 'DORA', description: 'Digital Operational Resilience' },
      { id: 'nis2', name: 'NIS2', description: 'Network & Information Security' },
      { id: 'iso-27001', name: 'ISO/IEC 27001:2022', description: 'Information security mgmt' },
      { id: 'iso-27701', name: 'ISO/IEC 27701', description: 'Privacy information mgmt' },
      { id: 'iso-42001', name: 'ISO/IEC 42001', description: 'AI management systems' },
      { id: 'bsi-c5', name: 'BSI C5', description: 'German cloud assurance' },
      { id: 'uk-gdpr', name: 'UK GDPR / DPA 2018', description: 'UK data protection' },
      { id: 'sccs', name: 'Schrems II SCCs', description: 'Standard Contractual Clauses' },
    ],
  },
];

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', tagline: 'Claude' },
  { id: 'openai', name: 'OpenAI', tagline: 'GPT' },
  { id: 'google-vertex', name: 'Google Vertex AI', tagline: 'Gemini' },
  { id: 'aws-bedrock', name: 'AWS Bedrock', tagline: 'Multi-model' },
  { id: 'azure-openai', name: 'Azure OpenAI', tagline: 'Enterprise OpenAI' },
  { id: 'mistral', name: 'Mistral AI', tagline: 'Mistral / Codestral' },
  { id: 'cohere', name: 'Cohere', tagline: 'Command' },
  { id: 'xai', name: 'xAI', tagline: 'Grok' },
  { id: 'groq', name: 'Groq', tagline: 'Fast inference' },
  { id: 'databricks', name: 'Databricks', tagline: 'Foundation Model APIs' },
  { id: 'fireworks', name: 'Fireworks AI', tagline: 'Open + fine-tuned' },
  { id: 'together', name: 'Together AI', tagline: 'Open model hosting' },
  { id: 'deepseek', name: 'DeepSeek', tagline: 'V3 / R1' },
  { id: 'perplexity', name: 'Perplexity', tagline: 'Sonar' },
];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const checkIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const plusIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`;

const xIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>
`;

const chevronIcon = `
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="m3 1.5 3 3.5-3 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const arrowIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const copyIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="5.5" y="2.5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
    <path d="M10.5 13.5h-7a1 1 0 0 1-1-1v-8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
`;

const bigCheckIcon = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="url(#wt-ok)"/>
    <path d="m10 16 4 4 8-9" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <defs>
      <linearGradient id="wt-ok" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0" stop-color="#0065FF"/>
        <stop offset="1" stop-color="#0052CC"/>
      </linearGradient>
    </defs>
  </svg>
`;

export async function renderProjectOnboarding(root, { navigate, projectId }) {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;

  let project;
  try {
    project = await api.getProject(projectId);
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

  const state = {
    name: project.name,
    perimeter_id: slugify(project.name) + '-prod',
    compliance: new Set(),
    activeRegion: 'Middle East',
    providers: [],
    daily_budget: 500,
    monthly_budget: 15000,
    hard_cap: true,
    alerts: { at70: true, at90: true, page100: true },
    submitting: false,
  };

  const view = pageShell({ user, project });
  root.innerHTML = view;
  mount(root, { state, project, navigate });
}

function pageShell({ user, project }) {
  return `
    <div class="ob-shell">
      <nav class="ob-nav">
        <div class="ob-nav-left">
          <div class="ob-nav-brand">
            ${logoMark(28)}
            <span>Bilvantis <span class="accent">WatchTower</span></span>
          </div>
          <nav class="ob-breadcrumb" aria-label="Breadcrumb">
            <a href="/" data-link>WatchTower</a>
            ${chevronIcon}
            <a href="/" data-link>Projects</a>
            ${chevronIcon}
            <span>New endpoint</span>
          </nav>
        </div>
        <div class="home-nav-actions">
          <div class="user-chip">
            <div class="user-avatar">${initials(user?.name)}</div>
            <span class="user-name">${escapeHtml(user?.name || 'User')}</span>
          </div>
        </div>
      </nav>

      <div class="ob-container">
        <header class="ob-header">
          <p class="eyebrow">A perimeter, configured.</p>
          <h1 class="ob-title">New endpoint</h1>
          <p class="ob-intro">Each endpoint is its own protected boundary — its own compliance packs, model provider, and budget. Set it once; the cluster enforces it.</p>
        </header>

        <ol class="ob-stepper" id="ob-stepper">
          ${['Identity','Compliance','Provider','Budget'].map((label, i) => `
            <li class="ob-step" data-step="${i+1}">
              <span class="ob-step-num">${i+1}</span>
              <span class="ob-step-label">${label}</span>
            </li>
          `).join('')}
        </ol>

        <div id="ob-error" hidden></div>

        ${sectionIdentity()}
        ${sectionCompliance()}
        ${sectionProvider()}
        ${sectionBudget()}

        <footer class="ob-footer">
          <p class="ob-footer-note">
            On finish, this writes a config the cluster deploys. The console collects choices;
            the cluster enforces them — and never holds your provider keys in plaintext.
          </p>
          <button class="btn btn-primary ob-submit" id="ob-create">
            <span>Create endpoint</span>
            ${arrowIcon}
          </button>
        </footer>
      </div>
    </div>
  `;
}

function sectionIdentity() {
  return `
    <section class="ob-section" data-step="1">
      <header class="ob-section-head">
        <span class="ob-section-eyebrow">Step one</span>
        <h2 class="ob-section-title">Endpoint identity</h2>
        <p class="ob-section-sub">Names the perimeter and scopes its audit trail.</p>
      </header>
      <div class="ob-section-body ob-grid-2">
        <div class="field">
          <label class="field-label" for="ob-name">Project name</label>
          <input class="field-input" id="ob-name" name="name" type="text" placeholder="retail-agent-prod" autocomplete="off" />
        </div>
        <div class="field">
          <label class="field-label" for="ob-perimeter">Perimeter ID</label>
          <input class="field-input" id="ob-perimeter" name="perimeter_id" type="text" placeholder="acme-retail-na-east" autocomplete="off" />
          <span class="field-hint">Lowercase, used in audit logs and cluster routing.</span>
        </div>
      </div>
    </section>
  `;
}

function sectionCompliance() {
  return `
    <section class="ob-section" data-step="2">
      <header class="ob-section-head ob-section-head-row">
        <div>
          <span class="ob-section-eyebrow">Step two</span>
          <h2 class="ob-section-title">Compliance packs</h2>
          <p class="ob-section-sub">Grouped by region. Selections accumulate across regions.</p>
        </div>
        <div class="ob-pill" id="ob-compliance-count">0 selected</div>
      </header>
      <div class="ob-section-body">
        <div class="ob-tabs" role="tablist" id="ob-region-tabs">
          ${COMPLIANCE.map((r, i) => `
            <button class="ob-tab${i === 0 ? ' is-active' : ''}" role="tab" data-region="${r.region}">
              <span>${r.region}</span>
              <span class="ob-tab-count" data-region-count="${r.region}">0</span>
            </button>
          `).join('')}
        </div>
        <div class="ob-pack-grid" id="ob-packs">
          ${renderPacksForRegion('Middle East', new Set())}
        </div>
      </div>
    </section>
  `;
}

function renderPacksForRegion(region, selected) {
  const r = COMPLIANCE.find((x) => x.region === region);
  return r.packs.map((p) => {
    const isOn = selected.has(p.id);
    return `
      <label class="ob-pack${isOn ? ' is-on' : ''}" data-pack-id="${p.id}">
        <input type="checkbox" data-pack="${p.id}" ${isOn ? 'checked' : ''} />
        <span class="ob-pack-check">${checkIcon}</span>
        <span class="ob-pack-body">
          <span class="ob-pack-name">${escapeHtml(p.name)}</span>
          <span class="ob-pack-desc">${escapeHtml(p.description)}</span>
        </span>
      </label>
    `;
  }).join('');
}

function sectionProvider() {
  return `
    <section class="ob-section" data-step="3">
      <header class="ob-section-head">
        <span class="ob-section-eyebrow">Step three</span>
        <h2 class="ob-section-title">Model provider & keys</h2>
        <p class="ob-section-sub">Add one or more. Order sets failover priority — keys are stored as references, never in plaintext.</p>
      </header>
      <div class="ob-section-body">
        <div class="ob-provider-list" id="ob-providers"></div>
        <button class="ob-add" type="button" id="ob-add-provider">
          ${plusIcon}<span>Add provider</span>
        </button>
      </div>
    </section>
  `;
}

function sectionBudget() {
  return `
    <section class="ob-section" data-step="4">
      <header class="ob-section-head">
        <span class="ob-section-eyebrow">Step four</span>
        <h2 class="ob-section-title">Budget & alarms</h2>
        <p class="ob-section-sub">Spend caps and the thresholds that alert — or block.</p>
      </header>
      <div class="ob-section-body ob-grid-budget">
        <div class="field">
          <label class="field-label" for="ob-budget">Daily budget (USD)</label>
          <div class="ob-currency">
            <span class="ob-currency-prefix">$</span>
            <input class="field-input ob-currency-input" id="ob-budget" name="daily_budget" type="number" min="0" step="10" value="500" />
          </div>
          <span class="field-hint">Resets at 00:00 UTC.</span>
        </div>

        <div class="field">
          <label class="field-label" for="ob-budget-monthly">Monthly budget (USD)</label>
          <div class="ob-currency">
            <span class="ob-currency-prefix">$</span>
            <input class="field-input ob-currency-input" id="ob-budget-monthly" name="monthly_budget" type="number" min="0" step="100" value="15000" />
          </div>
          <span class="field-hint">Resets on the 1st at 00:00 UTC.</span>
        </div>

        <div class="ob-card-soft" style="grid-column:1 / -1">
          <div class="ob-card-head">
            <h3 class="ob-card-title">On limit reached</h3>
            <p class="ob-card-sub">Enforced against whichever cap — daily or monthly — is hit first.</p>
          </div>
          <label class="ob-switch-row" for="ob-hardcap">
            <span class="ob-switch-text">
              <strong>Block new requests — hard cap</strong>
              <span>Refuse at 100%. Otherwise spend continues, alarms only.</span>
            </span>
            <span class="ob-switch">
              <input type="checkbox" id="ob-hardcap" checked />
              <span class="ob-switch-track"></span>
            </span>
          </label>
        </div>

        <div class="ob-card-soft" style="grid-column:1 / -1">
          <div class="ob-card-head">
            <h3 class="ob-card-title">Alarm thresholds</h3>
            <p class="ob-card-sub">Notifications fire as spend crosses each level.</p>
          </div>
          <div class="ob-alarms">
            <label class="ob-switch-row" for="ob-alert-70">
              <span class="ob-switch-text">
                <strong>Alert at 70%</strong>
                <span>Email + Slack to project owner.</span>
              </span>
              <span class="ob-switch"><input type="checkbox" id="ob-alert-70" checked /><span class="ob-switch-track"></span></span>
            </label>
            <label class="ob-switch-row" for="ob-alert-90">
              <span class="ob-switch-text">
                <strong>Alert at 90%</strong>
                <span>Email + Slack to project owner.</span>
              </span>
              <span class="ob-switch"><input type="checkbox" id="ob-alert-90" checked /><span class="ob-switch-track"></span></span>
            </label>
            <label class="ob-switch-row" for="ob-page-100">
              <span class="ob-switch-text">
                <strong>Page on-call at 100%</strong>
                <span>PagerDuty / Opsgenie incident.</span>
              </span>
              <span class="ob-switch"><input type="checkbox" id="ob-page-100" checked /><span class="ob-switch-track"></span></span>
            </label>
          </div>
        </div>

        <p class="ob-note" style="grid-column:1 / -1">
          A hard cap applies fail-closed to spend: at 100% of either the daily or monthly cap — whichever is hit first — new requests are refused rather than billed.
        </p>
      </div>
    </section>
  `;
}

function providerRow(state, p, idx) {
  const selected = PROVIDERS.find((x) => x.id === p.provider) || PROVIDERS[0];
  const options = PROVIDERS.map((x) => `<option value="${x.id}" ${x.id === selected.id ? 'selected' : ''}>${x.name}</option>`).join('');
  const status = p.key ? (p.checking ? 'Checking' : 'Valid') : 'Awaiting key';
  const statusClass = p.key ? (p.checking ? 'is-pending' : 'is-ok') : 'is-muted';
  return `
    <div class="ob-provider" data-pid="${p._id}">
      <div class="ob-provider-rank">${idx + 1}</div>
      <div class="ob-provider-select">
        <select data-role="provider">${options}</select>
        <span class="ob-provider-tag">${escapeHtml(selected.tagline)}</span>
      </div>
      <div class="ob-provider-key">
        <input type="password" placeholder="sk-•••••••••••••••" data-role="key" value="${escapeHtml(p.key || '')}" autocomplete="off" spellcheck="false" />
      </div>
      <div class="ob-provider-status ${statusClass}">${status}</div>
      <button class="ob-provider-remove" type="button" data-role="remove" aria-label="Remove provider">${xIcon}</button>
    </div>
  `;
}

function mount(root, { state, project, navigate }) {
  const nameEl = root.querySelector('#ob-name');
  const perimEl = root.querySelector('#ob-perimeter');
  nameEl.value = state.name;
  perimEl.value = state.perimeter_id;

  let userTouchedPerim = false;
  nameEl.addEventListener('input', (e) => {
    state.name = e.target.value;
    if (!userTouchedPerim) {
      state.perimeter_id = slugify(state.name) + (slugify(state.name) ? '-prod' : '');
      perimEl.value = state.perimeter_id;
    }
    updateStepper(root, state);
  });
  perimEl.addEventListener('input', (e) => {
    userTouchedPerim = true;
    state.perimeter_id = e.target.value;
    updateStepper(root, state);
  });

  const tabs = root.querySelectorAll('#ob-region-tabs .ob-tab');
  const packsEl = root.querySelector('#ob-packs');

  const repaintPacks = () => {
    packsEl.innerHTML = renderPacksForRegion(state.activeRegion, state.compliance);
    wirePacks();
  };

  const refreshCounts = () => {
    root.querySelector('#ob-compliance-count').textContent = `${state.compliance.size} selected`;
    COMPLIANCE.forEach((r) => {
      const count = r.packs.filter((p) => state.compliance.has(p.id)).length;
      const el = root.querySelector(`[data-region-count="${r.region}"]`);
      if (el) {
        el.textContent = count;
        el.classList.toggle('has-count', count > 0);
      }
    });
    updateStepper(root, state);
  };

  const wirePacks = () => {
    packsEl.querySelectorAll('.ob-pack').forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      input.addEventListener('change', () => {
        const id = input.dataset.pack;
        if (input.checked) state.compliance.add(id);
        else state.compliance.delete(id);
        label.classList.toggle('is-on', input.checked);
        refreshCounts();
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeRegion = tab.dataset.region;
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      repaintPacks();
    });
  });

  wirePacks();
  refreshCounts();

  // Providers
  const providersEl = root.querySelector('#ob-providers');
  let providerSeq = 0;
  const addProvider = (preset = {}) => {
    providerSeq += 1;
    state.providers.push({ _id: providerSeq, provider: 'anthropic', key: '', checking: false, ...preset });
    repaintProviders();
  };

  const repaintProviders = () => {
    providersEl.innerHTML = state.providers.map((p, i) => providerRow(state, p, i)).join('');
    wireProviders();
    updateStepper(root, state);
  };

  const wireProviders = () => {
    providersEl.querySelectorAll('.ob-provider').forEach((row) => {
      const pid = Number(row.dataset.pid);
      const entry = state.providers.find((p) => p._id === pid);
      const sel = row.querySelector('[data-role="provider"]');
      const key = row.querySelector('[data-role="key"]');
      const remove = row.querySelector('[data-role="remove"]');

      sel.addEventListener('change', () => {
        entry.provider = sel.value;
        repaintProviders();
      });

      let timer;
      key.addEventListener('input', () => {
        entry.key = key.value;
        entry.checking = entry.key.length > 0;
        clearTimeout(timer);
        timer = setTimeout(() => {
          entry.checking = false;
          repaintProviders();
        }, 700);
        repaintProviders();
      });

      remove.addEventListener('click', () => {
        state.providers = state.providers.filter((p) => p._id !== pid);
        repaintProviders();
      });
    });
  };

  root.querySelector('#ob-add-provider').addEventListener('click', () => addProvider());
  addProvider({ provider: 'anthropic' });

  // Budget
  const budget = root.querySelector('#ob-budget');
  budget.addEventListener('input', () => {
    state.daily_budget = Number(budget.value) || 0;
    updateStepper(root, state);
  });
  const monthlyBudget = root.querySelector('#ob-budget-monthly');
  monthlyBudget.addEventListener('input', () => {
    state.monthly_budget = Number(monthlyBudget.value) || 0;
    updateStepper(root, state);
  });
  root.querySelector('#ob-hardcap').addEventListener('change', (e) => { state.hard_cap = e.target.checked; });
  root.querySelector('#ob-alert-70').addEventListener('change', (e) => { state.alerts.at70 = e.target.checked; });
  root.querySelector('#ob-alert-90').addEventListener('change', (e) => { state.alerts.at90 = e.target.checked; });
  root.querySelector('#ob-page-100').addEventListener('change', (e) => { state.alerts.page100 = e.target.checked; });

  // Breadcrumb / brand links
  root.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.getAttribute('href'));
    });
  });

  // Submit
  const submit = root.querySelector('#ob-create');
  const errorBox = root.querySelector('#ob-error');
  submit.addEventListener('click', async () => {
    const issues = validate(state);
    if (issues.length) {
      errorBox.hidden = false;
      errorBox.className = 'alert';
      errorBox.innerHTML = `${alertIcon}<span>${issues[0]}</span>`;
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    errorBox.hidden = true;
    submit.disabled = true;
    submit.innerHTML = `<span class="spinner"></span><span>Deploying config…</span>`;
    try {
      const endpoint = await api.createEndpoint(project.id, {
        name: state.name.trim(),
        perimeter_id: state.perimeter_id.trim(),
        config: {
          compliance: Array.from(state.compliance),
          providers: state.providers.map(({ _id, checking, ...rest }) => ({
            ...rest,
            key: rest.key ? '••• stored as reference' : '',
          })),
          budget: {
            daily_usd: state.daily_budget,
            monthly_usd: state.monthly_budget,
            hard_cap: state.hard_cap,
            alerts: state.alerts,
          },
        },
      });
      showSuccess(root, { project, endpoint, state, navigate });
    } catch (err) {
      errorBox.hidden = false;
      errorBox.className = 'alert';
      errorBox.innerHTML = `${alertIcon}<span>${escapeHtml(err.message)}</span>`;
      submit.disabled = false;
      submit.innerHTML = `<span>Create endpoint</span>${arrowIcon}`;
    }
  });

  updateStepper(root, state);
}

function langgraphSnippet({ baseUrl, apiKey, providerHint }) {
  const modelHint = providerModelHint(providerHint);
  return `# LangGraph node — same SDK, new base URL
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="${baseUrl}",
    api_key="${apiKey}",   # WatchTower key — never your provider key
    model="${modelHint}",   # cluster routes per failover order
)

# Use anywhere in your LangGraph workflow
response = llm.invoke("Summarize the policy doc.")`;
}

function providerModelHint(providerId) {
  switch (providerId) {
    case 'anthropic': return 'claude-sonnet-4-6';
    case 'openai': return 'gpt-4.1';
    case 'google-vertex': return 'gemini-2.5-pro';
    case 'aws-bedrock': return 'anthropic.claude-sonnet-4-6';
    case 'azure-openai': return 'gpt-4.1';
    case 'mistral': return 'mistral-large-latest';
    case 'cohere': return 'command-r-plus';
    case 'xai': return 'grok-3';
    case 'groq': return 'llama-3.3-70b-versatile';
    case 'databricks': return 'databricks-meta-llama-3-1-405b-instruct';
    case 'fireworks': return 'accounts/fireworks/models/llama-v3p3-70b-instruct';
    case 'together': return 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
    case 'deepseek': return 'deepseek-chat';
    case 'perplexity': return 'sonar-pro';
    default: return 'claude-sonnet-4-6';
  }
}

function colorizePython(src) {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const escaped = esc(src);
  // Single-pass tokenizer — order in the alternation sets precedence
  const pattern = /(#[^\n]*)|("[^"\n]*")|\b(from|import|def|return|as|None|True|False)\b|\b([A-Z][A-Za-z0-9_]+)\b/g;
  return escaped.replace(pattern, (m, c, s, k, t) => {
    if (c) return `<span class="tk-c">${c}</span>`;
    if (s) return `<span class="tk-s">${s}</span>`;
    if (k) return `<span class="tk-k">${k}</span>`;
    if (t) return `<span class="tk-t">${t}</span>`;
    return m;
  });
}

function showSuccess(root, { project, endpoint, state, navigate }) {
  const cfg = endpoint.config || {};
  const baseUrl = cfg.base_url || '';
  const apiKey = cfg.api_key || '';
  const firstProvider = state.providers.find((p) => p.key)?.provider || 'anthropic';
  const snippet = langgraphSnippet({ baseUrl, apiKey, providerHint: firstProvider });

  const container = root.querySelector('.ob-container');
  container.innerHTML = `
    <div class="ob-success">
      <div class="ob-success-icon">${bigCheckIcon}</div>
      <p class="eyebrow">Deployed · v1</p>
      <h1 class="ob-success-title">Your endpoint is live</h1>
      <p class="ob-success-sub">
        Use this base URL in LangGraph, LangChain, or any OpenAI-compatible client.
        Your provider keys never leave the cluster.
      </p>

      <div class="ob-deploy-card">
        <div class="ob-deploy-row">
          <span class="ob-deploy-label">Endpoint ID</span>
          <div class="ob-deploy-value">
            <code>${escapeHtml(endpoint.perimeter_id)}</code>
          </div>
        </div>

        <div class="ob-deploy-row">
          <span class="ob-deploy-label">Base URL</span>
          <div class="ob-deploy-value ob-deploy-copyable">
            <code id="copy-url">${escapeHtml(baseUrl)}</code>
            <button class="ob-copy-btn" data-copy="copy-url">${copyIcon}<span>Copy</span></button>
          </div>
        </div>

        <div class="ob-deploy-row">
          <span class="ob-deploy-label">WatchTower key</span>
          <div class="ob-deploy-value ob-deploy-copyable">
            <code id="copy-key" class="ob-mask">${escapeHtml(apiKey)}</code>
            <button class="ob-reveal-btn" id="reveal-key" aria-label="Reveal key" title="Show / hide">Show</button>
            <button class="ob-copy-btn" data-copy="copy-key">${copyIcon}<span>Copy</span></button>
          </div>
        </div>

        <div class="ob-deploy-row ob-deploy-row-stack">
          <span class="ob-deploy-label">
            Providers
            <span class="ob-deploy-sublabel">Failover order</span>
          </span>
          <div class="ob-deploy-providers">
            ${state.providers.filter((p) => p.key).map((p, i) => {
              const meta = PROVIDERS.find((x) => x.id === p.provider) || { name: p.provider, tagline: '' };
              return `
                <div class="ob-prov-chip">
                  <span class="ob-prov-rank">${i + 1}</span>
                  <span class="ob-prov-meta">
                    <span class="ob-prov-name">${escapeHtml(meta.name)}</span>
                    <span class="ob-prov-tag">${escapeHtml(meta.tagline)}</span>
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="ob-snippet">
        <header class="ob-snippet-head">
          <div>
            <span class="ob-snippet-eyebrow">Drop into LangGraph</span>
            <h3 class="ob-snippet-title">Python · LangChain ChatOpenAI</h3>
          </div>
          <button class="ob-copy-btn" data-copy-text="snippet">${copyIcon}<span>Copy</span></button>
        </header>
        <pre class="ob-code"><code id="snippet">${colorizePython(snippet)}</code></pre>
      </div>

      <div class="ob-success-summary">
        <div class="ob-summary-item">
          <span class="ob-summary-num">${state.compliance.size}</span>
          <span class="ob-summary-label">compliance pack${state.compliance.size === 1 ? '' : 's'} enforced</span>
        </div>
        <div class="ob-summary-divider"></div>
        <div class="ob-summary-item">
          <span class="ob-summary-num">${state.providers.filter((p) => p.key).length}</span>
          <span class="ob-summary-label">provider${state.providers.filter((p) => p.key).length === 1 ? '' : 's'} in failover</span>
        </div>
        <div class="ob-summary-divider"></div>
        <div class="ob-summary-item">
          <span class="ob-summary-num">$${state.daily_budget.toLocaleString()}<span class="ob-summary-unit"> / day</span></span>
          <span class="ob-summary-label">${state.hard_cap ? 'hard-cap enforced' : 'alarms only'}</span>
        </div>
      </div>

      <div class="ob-success-actions">
        <button class="btn-ghost" id="done-add-another">Create another endpoint</button>
        <button class="btn btn-primary" id="done-back">Back to projects</button>
      </div>
    </div>
  `;

  // Snippet plain text for clipboard
  const snippetTextMap = { snippet };

  container.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-copy');
      const text = container.querySelector(`#${id}`)?.textContent || '';
      await copyToClipboard(text, btn);
    });
  });

  container.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-copy-text');
      await copyToClipboard(snippetTextMap[key] || '', btn);
    });
  });

  const keyEl = container.querySelector('#copy-key');
  const revealBtn = container.querySelector('#reveal-key');
  let revealed = false;
  const realKey = apiKey;
  const maskedKey = apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 8));
  keyEl.textContent = maskedKey;
  revealBtn.addEventListener('click', () => {
    revealed = !revealed;
    keyEl.textContent = revealed ? realKey : maskedKey;
    revealBtn.textContent = revealed ? 'Hide' : 'Show';
  });

  container.querySelector('#done-back').addEventListener('click', () => navigate('/'));
  container.querySelector('#done-add-another').addEventListener('click', () => {
    window.history.replaceState({}, '', `/projects/${project.id}/onboarding`);
    renderProjectOnboarding(root, { navigate, projectId: project.id });
  });

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.innerHTML;
    btn.classList.add('is-copied');
    btn.innerHTML = `${checkIcon}<span>Copied</span>`;
    setTimeout(() => {
      btn.classList.remove('is-copied');
      btn.innerHTML = original;
    }, 1400);
  } catch {
    /* clipboard blocked */
  }
}

function validate(state) {
  const issues = [];
  if (!state.name.trim()) issues.push('Endpoint name is required.');
  if (!state.perimeter_id.trim()) issues.push('Perimeter ID is required.');
  if (state.compliance.size === 0) issues.push('Select at least one compliance pack.');
  if (state.providers.length === 0 || !state.providers.some((p) => p.key && p.key.trim())) {
    issues.push('Add at least one model provider with an API key.');
  }
  if (!(state.daily_budget > 0)) issues.push('Daily budget must be greater than zero.');
  if (!(state.monthly_budget > 0)) issues.push('Monthly budget must be greater than zero.');
  if (state.monthly_budget > 0 && state.daily_budget > state.monthly_budget) {
    issues.push('Daily budget cannot exceed the monthly budget.');
  }
  return issues;
}

function stepStatus(state, step) {
  if (step === 1) return state.name.trim() && state.perimeter_id.trim();
  if (step === 2) return state.compliance.size > 0;
  if (step === 3) return state.providers.some((p) => p.key && p.key.trim());
  if (step === 4) return state.daily_budget > 0 && state.monthly_budget > 0;
  return false;
}

function updateStepper(root, state) {
  const stepper = root.querySelector('#ob-stepper');
  if (!stepper) return;
  stepper.querySelectorAll('.ob-step').forEach((el) => {
    const step = Number(el.dataset.step);
    const done = stepStatus(state, step);
    el.classList.toggle('is-done', done);
  });
}
