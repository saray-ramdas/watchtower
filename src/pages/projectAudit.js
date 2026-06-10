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

const refreshIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8a5 5 0 1 0 1.5-3.5M3 3v2.5h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const closeIcon = `
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>
`;

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch { return ''; }
}

function relTime(iso) {
  try {
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function typeBadge(event) {
  if (event.blocked) return `<span class="audit-type audit-type-block">Blocked</span>`;
  if (event.event_type === 'mask') return `<span class="audit-type audit-type-mask">Mask</span>`;
  return `<span class="audit-type audit-type-proxy">Proxy</span>`;
}

function statusBadge(event) {
  if (event.blocked) return `<span class="audit-status audit-status-blocked">Denied · ${event.status_code || 403}</span>`;
  if (event.status_code && event.status_code >= 400) return `<span class="audit-status audit-status-fail">Failed · ${event.status_code}</span>`;
  if (event.status_code) return `<span class="audit-status audit-status-ok">${event.status_code}</span>`;
  return `<span class="audit-status audit-status-ok">OK</span>`;
}

function panel(title, body, modifier = '') {
  if (!body) return '';
  return `
    <div class="lifecycle-panel ${modifier}">
      <div class="lifecycle-panel-head">${escapeHtml(title)}</div>
      <pre class="lifecycle-panel-body">${escapeHtml(body)}</pre>
    </div>
  `;
}

function lifecycleHtml(event) {
  if (event.blocked) {
    return `
      <div class="lifecycle">
        ${panel('Raw input — what the user sent', event.raw_input || event.prompt_preview || '', 'lifecycle-input')}
        <div class="lifecycle-arrow lifecycle-arrow-block">DENIED · ${escapeHtml((event.block_reason || '').replace(/_/g, ' '))}</div>
        ${panel('Gateway response — returned to caller', event.final_output || '', 'lifecycle-block-out')}
      </div>
    `;
  }
  if (event.event_type === 'mask') {
    return `
      <div class="lifecycle">
        ${panel('Raw input — what the user sent', event.raw_input || '', 'lifecycle-input')}
        <div class="lifecycle-arrow">redacted · ${event.entities_masked} entit${event.entities_masked === 1 ? 'y' : 'ies'}</div>
        ${panel('Masked input — what the LLM will see', event.masked_input || '', 'lifecycle-masked')}
      </div>
    `;
  }
  // proxy success
  return `
    <div class="lifecycle">
      ${panel('Raw input — what the user sent', event.raw_input || '— (not captured for this row; see the preceding mask event)', 'lifecycle-input')}
      <div class="lifecycle-arrow">sent to ${escapeHtml(event.upstream_provider || 'upstream')}</div>
      ${panel('Masked input — what the LLM saw', event.masked_input || event.prompt_preview || '', 'lifecycle-masked')}
      <div class="lifecycle-arrow">model returned</div>
      ${panel('Raw output — what the LLM replied', event.raw_output || '', 'lifecycle-output')}
      <div class="lifecycle-arrow lifecycle-arrow-final">re-identified for the user</div>
      ${panel('Final output — what the user saw', event.final_output || '— (still in flight)', 'lifecycle-final')}
    </div>
  `;
}

function row(event) {
  const preview = event.prompt_preview || '';
  const provider = event.upstream_provider ? `<span class="audit-chip">${escapeHtml(event.upstream_provider)}</span>` : '';
  const tokens = event.total_tokens > 0
    ? `<span class="audit-chip">${event.total_tokens.toLocaleString()} tok</span>`
    : '';
  const masked = event.entities_masked > 0
    ? `<span class="audit-chip audit-chip-blue">${event.entities_masked} masked</span>`
    : '';
  const reason = event.block_reason
    ? `<span class="audit-chip audit-chip-red">${escapeHtml(event.block_reason.replace(/_/g, ' '))}</span>`
    : '';

  return `
    <tr class="audit-row${event.blocked ? ' is-blocked' : ''}" data-id="${event.id}">
      <td class="audit-cell-time">
        <div class="audit-time-rel">${escapeHtml(relTime(event.created_at))}</div>
        <div class="audit-time-abs">${escapeHtml(formatTime(event.created_at))}</div>
      </td>
      <td class="audit-cell-endpoint">
        <div class="audit-endpoint-name">${escapeHtml(event.endpoint_name || '—')}</div>
        <code class="audit-endpoint-perimeter">${escapeHtml(event.perimeter_id || '')}</code>
      </td>
      <td class="audit-cell-type">${typeBadge(event)}</td>
      <td class="audit-cell-status">${statusBadge(event)}</td>
      <td class="audit-cell-preview">
        <div class="audit-preview-row">${reason}${masked}${tokens}${provider}<span class="audit-expand-hint">view lifecycle</span></div>
        <div class="audit-preview-text">${preview ? escapeHtml(preview) : '<span class="audit-empty">—</span>'}</div>
        ${event.block_message ? `<div class="audit-preview-note">${escapeHtml(event.block_message)}</div>` : ''}
      </td>
    </tr>
  `;
}

function emptyState(filter) {
  if (filter === 'suspicious') {
    return `
      <div class="audit-empty-state">
        <div class="audit-empty-icon">${chevronIcon}</div>
        <h3>No suspicious activity</h3>
        <p>No blocked requests in this project — try a prompt-injection prompt on the Test endpoint page to see one captured here.</p>
      </div>
    `;
  }
  return `
    <div class="audit-empty-state">
      <h3>No events yet</h3>
      <p>Run a Test endpoint request to populate the audit trail.</p>
    </div>
  `;
}

export async function renderProjectAudit(root, { navigate, projectId }) {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;

  let project;
  try {
    project = await api.getProject(projectId);
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('credentials')) {
      auth.clear(); navigate('/login'); return;
    }
    root.innerHTML = `
      <div class="auth-shell"><div class="auth-container"><div class="auth-card">
        <h1 class="auth-title">Couldn't load project</h1>
        <p class="auth-subtitle">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary" id="back-home">Back to projects</button>
      </div></div></div>`;
    root.querySelector('#back-home').addEventListener('click', () => navigate('/'));
    return;
  }

  const user = auth.getUser();
  const state = { filter: 'all', events: [], from: '', to: '' };

  root.innerHTML = shell({ user, project });
  await refresh(root, state, project);
  wire(root, state, project, navigate);
}

function shell({ user, project }) {
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
            <span>Audit log</span>
          </nav>
        </div>
        <div class="home-nav-actions">
          <div class="user-chip">
            <div class="user-avatar">${initials(user?.name)}</div>
            <span class="user-name">${escapeHtml(user?.name || 'User')}</span>
          </div>
        </div>
      </nav>

      <div class="audit-container">
        <header class="audit-header">
          <div>
            <p class="eyebrow">Audit log</p>
            <h1 class="audit-title">Activity</h1>
            <p class="audit-sub">Every gateway event for ${escapeHtml(project.name)} — timestamped, filterable, and immutable.</p>
          </div>
          <div class="audit-header-actions">
            <button class="dash-icon-btn" id="audit-refresh" aria-label="Refresh" title="Refresh">${refreshIcon}</button>
          </div>
        </header>

        <div class="audit-controls">
          <div class="audit-filter-group" role="tablist">
            <button class="audit-filter is-active" data-filter="all">All events</button>
            <button class="audit-filter" data-filter="suspicious">Suspicious only</button>
          </div>
          <div class="audit-range">
            <div class="audit-range-field">
              <label class="audit-range-label" for="audit-from">From</label>
              <input class="audit-range-input" id="audit-from" type="datetime-local" />
            </div>
            <span class="audit-range-sep">→</span>
            <div class="audit-range-field">
              <label class="audit-range-label" for="audit-to">To</label>
              <input class="audit-range-input" id="audit-to" type="datetime-local" />
            </div>
            <div class="audit-range-presets">
              <button class="audit-preset" data-preset="1h">1h</button>
              <button class="audit-preset" data-preset="24h">24h</button>
              <button class="audit-preset" data-preset="7d">7d</button>
            </div>
            <button class="audit-clear" id="audit-clear">Clear</button>
          </div>
          <div class="audit-meta" id="audit-meta"></div>
        </div>

        <div class="audit-table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th class="audit-th audit-th-time">When</th>
                <th class="audit-th">Endpoint</th>
                <th class="audit-th">Type</th>
                <th class="audit-th">Status</th>
                <th class="audit-th">Activity</th>
              </tr>
            </thead>
            <tbody id="audit-tbody">
              <tr><td colspan="5" class="audit-loading"><div class="app-loading-spinner"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function refresh(root, state, project) {
  const tbody = root.querySelector('#audit-tbody');
  const meta = root.querySelector('#audit-meta');
  tbody.innerHTML = `<tr><td colspan="5" class="audit-loading"><div class="app-loading-spinner"></div></td></tr>`;
  try {
    const events = await api.listProjectEvents(project.id, {
      suspiciousOnly: state.filter === 'suspicious',
      limit: 300,
      from: state.from || null,
      to: state.to || null,
    });
    state.events = events;
    if (events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyState(state.filter)}</td></tr>`;
      meta.textContent = '';
      return;
    }
    tbody.innerHTML = events.map(row).join('');
    const blockedCount = events.filter((e) => e.blocked).length;
    meta.innerHTML = state.filter === 'suspicious'
      ? `<span>${events.length} blocked event${events.length === 1 ? '' : 's'}</span>`
      : `<span>${events.length} recent event${events.length === 1 ? '' : 's'}${blockedCount > 0 ? ` · <strong style="color:#BF2600">${blockedCount} blocked</strong>` : ''}</span>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="alert">${alertIcon}<span>${escapeHtml(err.message)}</span></div></td></tr>`;
  }
}

function wire(root, state, project, navigate) {
  root.querySelectorAll('[data-link]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); navigate(a.getAttribute('href')); });
  });

  root.querySelectorAll('.audit-filter').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.filter = btn.dataset.filter;
      root.querySelectorAll('.audit-filter').forEach((b) => b.classList.toggle('is-active', b === btn));
      await refresh(root, state, project);
    });
  });

  root.querySelector('#audit-refresh').addEventListener('click', () => refresh(root, state, project));

  const fromInput = root.querySelector('#audit-from');
  const toInput = root.querySelector('#audit-to');
  const clearBtn = root.querySelector('#audit-clear');

  let rangeDebounce;
  const onRangeChange = () => {
    state.from = fromInput.value || '';
    state.to = toInput.value || '';
    clearTimeout(rangeDebounce);
    rangeDebounce = setTimeout(() => refresh(root, state, project), 220);
  };
  fromInput.addEventListener('change', onRangeChange);
  toInput.addEventListener('change', onRangeChange);

  clearBtn.addEventListener('click', () => {
    fromInput.value = '';
    toInput.value = '';
    state.from = '';
    state.to = '';
    root.querySelectorAll('.audit-preset').forEach((b) => b.classList.remove('is-active'));
    refresh(root, state, project);
  });

  // Presets — set both inputs to a window ending now
  root.querySelectorAll('.audit-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const now = new Date();
      const minutesByPreset = { '1h': 60, '24h': 60 * 24, '7d': 60 * 24 * 7 };
      const minutes = minutesByPreset[btn.dataset.preset] || 60;
      const start = new Date(now.getTime() - minutes * 60 * 1000);
      fromInput.value = toLocalInput(start);
      toInput.value = toLocalInput(now);
      state.from = fromInput.value;
      state.to = toInput.value;
      root.querySelectorAll('.audit-preset').forEach((b) => b.classList.toggle('is-active', b === btn));
      refresh(root, state, project);
    });
  });

  // Delegated row click → open lifecycle modal
  root.addEventListener('click', (e) => {
    const tr = e.target.closest('.audit-row');
    if (!tr) return;
    const id = Number(tr.dataset.id);
    const event = state.events.find((ev) => ev.id === id);
    if (event) openLifecycleModal(event);
  });
}

function openLifecycleModal(event) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop audit-backdrop';
  wrap.innerHTML = `
    <div class="modal-card audit-modal-card" role="dialog" aria-modal="true">
      <header class="audit-modal-head">
        <div class="audit-modal-head-left">
          <p class="audit-modal-eyebrow">${escapeHtml(formatTime(event.created_at))} · ${escapeHtml(relTime(event.created_at))}</p>
          <h2 class="audit-modal-title">${escapeHtml(event.endpoint_name || 'Event')}</h2>
          <div class="audit-modal-meta">
            <code class="audit-modal-perimeter">${escapeHtml(event.perimeter_id || '')}</code>
            ${typeBadge(event)}
            ${statusBadge(event)}
            ${event.upstream_provider ? `<span class="audit-chip">${escapeHtml(event.upstream_provider)}</span>` : ''}
            ${event.total_tokens > 0 ? `<span class="audit-chip">${event.total_tokens.toLocaleString()} tok</span>` : ''}
            ${event.entities_masked > 0 ? `<span class="audit-chip audit-chip-blue">${event.entities_masked} masked</span>` : ''}
            ${event.block_reason ? `<span class="audit-chip audit-chip-red">${escapeHtml(event.block_reason.replace(/_/g, ' '))}</span>` : ''}
          </div>
        </div>
        <button class="docs-close" data-close aria-label="Close">${closeIcon}</button>
      </header>
      <div class="audit-modal-body">
        ${lifecycleHtml(event)}
        ${event.block_message ? `<p class="audit-modal-note">${escapeHtml(event.block_message)}</p>` : ''}
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
}
