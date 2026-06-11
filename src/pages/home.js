import { api, auth } from '../api.js';
import { signOut } from '../session.js';
import { alertIcon, initials, logoMark } from '../ui.js';

const plusIcon = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`;

const folderIcon = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 5.5a1.5 1.5 0 0 1 1.5-1.5h3.6a1.5 1.5 0 0 1 1.06.44l1 1a1.5 1.5 0 0 0 1.06.44H16a1.5 1.5 0 0 1 1.5 1.5V14a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 14V5.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>
`;

const trashIcon = `
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4 4.5l.6 8.2a1.5 1.5 0 0 0 1.5 1.4h3.8a1.5 1.5 0 0 0 1.5-1.4l.6-8.2M7 7.5v4M9 7.5v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const warnIcon = `
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2.5 1.5 17h17L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M10 8v3.5M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function projectCard(p) {
  const desc = p.description ? p.description : 'No description';
  const initial = (p.name || '?').trim().charAt(0).toUpperCase();
  return `
    <div class="project-card${p.is_paused ? ' is-paused' : ''}" data-id="${p.id}">
      <button class="project-card-delete" data-action="delete" data-id="${p.id}" aria-label="Delete project" title="Delete project">
        ${trashIcon}
      </button>
      <div class="project-card-icon">${initial}</div>
      <div class="project-card-body">
        <div class="project-card-name-row">
          <div class="project-card-name">${escapeHtml(p.name)}</div>
          ${p.is_paused ? '<span class="paused-pill"><span class="paused-dot"></span>Paused</span>' : ''}
        </div>
        <div class="project-card-desc">${escapeHtml(desc)}</div>
      </div>
      <div class="project-card-meta">Created ${formatDate(p.created_at)}</div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export async function renderHome(root, { navigate }) {
  const user = auth.getUser();

  root.innerHTML = `
    <div class="home-shell">
      <nav class="home-nav">
        <div class="home-nav-brand">
          ${logoMark(28)}
          <span class="accent">WatchTower</span>
        </div>
        <div class="home-nav-actions">
          <div class="user-chip">
            <div class="user-avatar">${initials(user?.name)}</div>
            <span class="user-name">${user?.name || 'User'}</span>
            ${user?.is_super_admin ? '<span class="role-tag">Super Admin</span>' : ''}
          </div>
          <button class="btn-ghost" id="logout-btn">Sign out</button>
        </div>
      </nav>

      <main class="home-main" id="home-main">
        <div class="app-loading-spinner" id="home-loading"></div>
      </main>
    </div>
  `;

  root.querySelector('#logout-btn').addEventListener('click', async () => {
    await signOut(navigate);
  });

  await loadProjects(root, { user });
}

async function loadProjects(root, { user }) {
  const main = root.querySelector('#home-main');
  let projects = [];
  try {
    projects = await api.listProjects();
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('credentials')) {
      auth.clear();
      window.location.assign('/login');
      return;
    }
    main.innerHTML = `
      <div class="alert" style="max-width:420px">${alertIcon}<span>Could not load projects: ${escapeHtml(err.message)}</span></div>
    `;
    return;
  }

  if (projects.length === 0) {
    main.classList.add('is-empty');
    main.innerHTML = `
      <div class="home-hero">
        <div class="home-hero-mark">
          <img src="/image.png" width="64" height="64" alt="Bilvantis WatchTower" style="display:block;width:64px;height:64px;object-fit:contain;border-radius:16px"/>
        </div>
        <h1 class="home-hero-title">Bilvantis <span class="accent">WatchTower</span></h1>
        <p class="home-hero-subtitle">
          Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Let's start by creating your first project.
        </p>
        <button class="btn btn-primary" id="create-first-project">
          ${plusIcon}<span>Create new project</span>
        </button>
      </div>
    `;
    main.querySelector('#create-first-project').addEventListener('click', () => openCreateModal(root, { user }));
    return;
  }

  main.classList.remove('is-empty');
  main.innerHTML = `
    <div class="projects-wrap">
      <header class="projects-header">
        <div>
          <p class="projects-eyebrow">Workspace</p>
          <h1 class="projects-title">Projects</h1>
          <p class="projects-subtitle">${projects.length} ${projects.length === 1 ? 'project' : 'projects'} in your workspace</p>
        </div>
        <button class="btn btn-primary" id="create-project-btn">
          ${plusIcon}<span>New project</span>
        </button>
      </header>
      <div class="projects-grid">
        ${projects.map(projectCard).join('')}
      </div>
    </div>
  `;
  main.querySelector('#create-project-btn').addEventListener('click', () => openCreateModal(root, { user }));

  main.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const project = projects.find((p) => p.id === id);
      if (project) openDeleteModal(root, { user }, project);
    });
  });

  main.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="delete"]')) return;
      const id = Number(card.dataset.id);
      window.history.pushState({}, '', `/projects/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });
}

function openCreateModal(root, ctx) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div class="modal-icon">${folderIcon}</div>
        <div>
          <h2 class="modal-title">New project</h2>
          <p class="modal-subtitle">Give it a name and an optional description.</p>
        </div>
      </div>

      <div id="modal-error" hidden></div>

      <form id="project-form" class="auth-form" novalidate>
        <div class="field">
          <label class="field-label" for="project-name">Project name</label>
          <input class="field-input" id="project-name" name="name" type="text" placeholder="e.g. Sentinel" maxlength="120" required />
        </div>
        <div class="field">
          <label class="field-label" for="project-description">Description <span style="color:var(--text-subtle);font-weight:400">(optional)</span></label>
          <textarea class="field-input field-textarea" id="project-description" name="description" rows="3" placeholder="What is this project about?"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" type="button" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" type="submit" id="modal-submit">
            <span>Create project</span>
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-open'));

  const close = () => {
    wrap.classList.remove('is-open');
    setTimeout(() => wrap.remove(), 180);
  };

  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  wrap.querySelector('#modal-cancel').addEventListener('click', close);

  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  setTimeout(() => wrap.querySelector('#project-name').focus(), 60);

  const form = wrap.querySelector('#project-form');
  const submit = wrap.querySelector('#modal-submit');
  const errorBox = wrap.querySelector('#modal-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const data = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.innerHTML = `<span class="spinner"></span><span>Creating…</span>`;
    try {
      const project = await api.createProject({ name: data.name, description: data.description || null });
      close();
      window.history.pushState({}, '', `/projects/${project.id}/onboarding`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      errorBox.hidden = false;
      errorBox.className = 'alert';
      errorBox.innerHTML = `${alertIcon}<span>${escapeHtml(err.message)}</span>`;
      submit.disabled = false;
      submit.innerHTML = `<span>Create project</span>`;
    }
  });
}

function openDeleteModal(root, ctx, project) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal-card" role="alertdialog" aria-modal="true">
      <div class="modal-head">
        <div class="modal-icon modal-icon-danger">${warnIcon}</div>
        <div>
          <h2 class="modal-title">Delete project?</h2>
          <p class="modal-subtitle">
            This will permanently delete
            <strong style="color:var(--text)">${escapeHtml(project.name)}</strong>.
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div id="delete-error" hidden></div>

      <div class="modal-actions">
        <button class="btn-ghost" type="button" id="delete-cancel">Cancel</button>
        <button class="btn btn-danger" type="button" id="delete-confirm">
          <span>Delete project</span>
        </button>
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
  wrap.querySelector('#delete-cancel').addEventListener('click', close);

  const confirm = wrap.querySelector('#delete-confirm');
  const errorBox = wrap.querySelector('#delete-error');
  setTimeout(() => confirm.focus(), 60);

  confirm.addEventListener('click', async () => {
    errorBox.hidden = true;
    confirm.disabled = true;
    confirm.innerHTML = `<span class="spinner"></span><span>Deleting…</span>`;
    try {
      await api.deleteProject(project.id);
      close();
      await loadProjects(root, ctx);
    } catch (err) {
      errorBox.hidden = false;
      errorBox.className = 'alert';
      errorBox.innerHTML = `${alertIcon}<span>${escapeHtml(err.message)}</span>`;
      confirm.disabled = false;
      confirm.innerHTML = `<span>Delete project</span>`;
    }
  });
}
