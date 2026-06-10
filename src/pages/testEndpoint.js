import { api, auth } from '../api.js';
import { alertIcon, initials, logoMark } from '../ui.js';

const LOCAL_PROXY_BASE = 'http://127.0.0.1:8888';

const PROVIDER_MODEL_HINT = {
  anthropic: 'claude-sonnet-4-6', openai: 'gpt-4.1', 'google-vertex': 'gemini-2.5-pro',
  'aws-bedrock': 'anthropic.claude-sonnet-4-6', 'azure-openai': 'gpt-4.1',
  mistral: 'mistral-large-latest', cohere: 'command-r-plus', xai: 'grok-3',
  groq: 'llama-3.3-70b-versatile', databricks: 'databricks-meta-llama-3-1-405b-instruct',
  fireworks: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  deepseek: 'deepseek-chat', perplexity: 'sonar-pro',
};

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const chevronIcon = `
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="m3 1.5 3 3.5-3 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const sampleIcon = `
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
`;

const playIcon = `
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M5 3.2v9.6c0 .6.7.9 1.2.6l7.5-4.8c.5-.3.5-1 0-1.2L6.2 2.6c-.5-.3-1.2 0-1.2.6Z" fill="currentColor"/>
  </svg>
`;

const resetIcon = `
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M3 8a5 5 0 1 0 1.5-3.5M3 3v2.5h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const shieldStopIcon = `
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4 8 10v13.5C8 33 14.8 41 24 44c9.2-3 16-11 16-20.5V10L24 4Z" fill="url(#stop-g)"/>
    <path d="m17 17 14 14M31 17 17 31" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <defs>
      <linearGradient id="stop-g" x1="8" y1="4" x2="40" y2="44">
        <stop offset="0" stop-color="#FF5630"/>
        <stop offset="1" stop-color="#DE350B"/>
      </linearGradient>
    </defs>
  </svg>
`;

// ---------------------------------------------------------------------------
// Build the animation data from the backend's PII detection response.
// Backend response shape: { masked, token_map, detections: [{type, value, token, start, end}] }
// ---------------------------------------------------------------------------

function buildMaskInfo(text, response) {
  const masked = response.masked || text;
  const tokenMap = response.token_map || {};
  const detections = [...(response.detections || [])].sort((a, b) => a.start - b.start);

  // Left side: original text with PII spans highlighted in source order
  let cursor = 0;
  const leftParts = [];
  for (const d of detections) {
    if (d.start > cursor) leftParts.push(escapeHtml(text.slice(cursor, d.start)));
    leftParts.push(
      `<span class="pii pii-${escapeHtml(d.type)}" data-token="${escapeHtml(d.token)}">${escapeHtml(d.value)}</span>`,
    );
    cursor = d.end;
  }
  if (cursor < text.length) leftParts.push(escapeHtml(text.slice(cursor)));

  // Right side: segments built from the masked string for the typewriter/decode animation
  const segments = [];
  const tokenRegex = /\[([A-Z]+)_(\d+)\]/g;
  let lastEnd = 0;
  let m;
  while ((m = tokenRegex.exec(masked)) !== null) {
    if (m.index > lastEnd) segments.push({ type: 'text', text: masked.slice(lastEnd, m.index) });
    segments.push({ type: 'token', text: m[0], kind: m[1] });
    lastEnd = tokenRegex.lastIndex;
  }
  if (lastEnd < masked.length) segments.push({ type: 'text', text: masked.slice(lastEnd) });

  return { masked, tokenMap, leftHtml: leftParts.join(''), segments, detections };
}

function unmaskWithSegments(text, tokenMap) {
  // Returns { html for left (raw response with tokens highlighted), segments for right }
  const tokenRegex = /\[([A-Z]+)_(\d+)\]/g;
  const segments = [];
  const leftParts = [];
  let cursor = 0;
  let m;
  while ((m = tokenRegex.exec(text)) !== null) {
    const token = m[0];
    const type = m[1];
    const start = m.index;
    const end = start + token.length;
    const original = tokenMap[token];
    if (start > cursor) {
      const plain = text.slice(cursor, start);
      leftParts.push(escapeHtml(plain));
      segments.push({ type: 'text', text: plain });
    }
    if (original) {
      leftParts.push(`<span class="tok tok-${type}">${escapeHtml(token)}</span>`);
      segments.push({ type: 'reveal', text: original, kind: type, fromToken: token });
    } else {
      // Unknown token — just echo
      leftParts.push(escapeHtml(token));
      segments.push({ type: 'text', text: token });
    }
    cursor = end;
  }
  if (cursor < text.length) {
    const tail = text.slice(cursor);
    leftParts.push(escapeHtml(tail));
    segments.push({ type: 'text', text: tail });
  }
  return { leftHtml: leftParts.join(''), segments };
}

// ---------------------------------------------------------------------------
// Animation primitives
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GLYPHS = '!@#$%^&*<>?/|\\Ξ0123456789ABCDEFΛΨΩΦΣ';
function randomGlyph() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }

async function typewriteText(parentEl, text, speed = 8) {
  for (const ch of text) {
    if (ch === '\n') parentEl.appendChild(document.createElement('br'));
    else parentEl.appendChild(document.createTextNode(ch));
    if (ch !== ' ') await sleep(speed);
  }
}

async function decodeRevealSpan(parentEl, finalText, className, duration = 520) {
  const span = document.createElement('span');
  span.className = className;
  parentEl.appendChild(span);
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / duration);
      const settled = Math.floor(t * finalText.length);
      let out = finalText.slice(0, settled);
      for (let i = settled; i < finalText.length; i++) {
        out += randomGlyph();
      }
      span.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else { span.textContent = finalText; resolve(); }
    };
    requestAnimationFrame(tick);
  });
}

async function animateForwardReveal(panelEl, segments) {
  panelEl.innerHTML = '';
  for (const seg of segments) {
    if (seg.type === 'text') {
      await typewriteText(panelEl, seg.text, 6);
    } else if (seg.type === 'token') {
      await decodeRevealSpan(panelEl, seg.text, `tok tok-${seg.kind}`, 520);
      await sleep(60);
    }
  }
}

async function animateReverseReveal(panelEl, segments) {
  panelEl.innerHTML = '';
  for (const seg of segments) {
    if (seg.type === 'text') {
      await typewriteText(panelEl, seg.text, 6);
    } else if (seg.type === 'reveal') {
      // Reveal the actual original value with a decode effect, styled differently
      await decodeRevealSpan(panelEl, seg.text, `revealed revealed-${seg.kind}`, 560);
      await sleep(70);
    }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SAMPLE_PROMPT = `Hi, this is Sabeel Ahmed calling about my National Bonds loan, account 4532-1234-5678-9012. I'm 45 days past due with a balance of AED 18,500. I'd like to commit to a plan: AED 4,000 today from my Emirates NBD card ending in 7841, and AED 4,500 on the 15th of each month after that. Please send the agreement to sabeel.ahmed@bilvantis.io and a confirmation SMS to +971 50 555 0142. Confirm you've received the commitment.`;

const SYSTEM_PROMPT = `You are an AI collections specialist for National Bonds. A customer is contacting you with a payment commitment. Their message has been routed through a privacy gateway, so all personally identifying information has been replaced with opaque placeholder tokens like [NAME_001], [ACCOUNT_001], [CC_001], [PHONE_001], [EMAIL_001], [ADDRESS_001]. You cannot see the real values.

Your task is to record receipt of the commitment so the gateway can confirm back to the customer.

WRITING RULES — non-negotiable:
- Reference at least the customer's [NAME_*], their [ACCOUNT_*], and one contact channel ([EMAIL_*] or [PHONE_*]) in your reply.
- Write every placeholder token EXACTLY as you saw it: square brackets, uppercase type, underscore, three-digit index. Example: [NAME_001].
- NEVER substitute, normalize, or invent real values for a placeholder. Do not write "your account" — write "[ACCOUNT_001]". Do not write "your email" — write "[EMAIL_001]".
- Acknowledge each concrete term the customer offered: payment amount, payment date, recurring amount, recurring date, payment method.
- Be warm and professional. 3–4 sentences. No numbered lists.
- Open with "Thank you, [NAME_001]" or similar.
- End by stating that the agreement will be emailed to [EMAIL_001] and confirmation SMS will go to [PHONE_001] (only if those placeholders appeared in the input).`;

export async function renderTestEndpoint(root, { navigate, projectId, endpointId }) {
  root.innerHTML = `<div class="app-loading"><div class="app-loading-spinner"></div></div>`;

  let project, endpoints, endpoint;
  try {
    [project, endpoints] = await Promise.all([
      api.getProject(projectId),
      api.listEndpoints(projectId),
    ]);
    endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) throw new Error('Endpoint not found in this project');
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('credentials')) {
      auth.clear(); navigate('/login'); return;
    }
    root.innerHTML = `
      <div class="auth-shell"><div class="auth-container"><div class="auth-card">
        <h1 class="auth-title">Couldn't load endpoint</h1>
        <p class="auth-subtitle">${escapeHtml(err.message)}</p>
        <button class="btn btn-primary" id="back-home">Back to projects</button>
      </div></div></div>`;
    root.querySelector('#back-home').addEventListener('click', () => navigate('/'));
    return;
  }

  const user = auth.getUser();
  const cfg = endpoint.config || {};
  const localUrl = `${LOCAL_PROXY_BASE}/v1/${endpoint.perimeter_id}`;
  const apiKey = cfg.api_key || '';
  const providers = (cfg.providers || []).filter((p) => p.key);
  const firstProvider = providers[0]?.provider || 'anthropic';
  const defaultModel = PROVIDER_MODEL_HINT[firstProvider] || 'claude-sonnet-4-6';

  const state = {
    phase: 'idle',     // idle | masking | sending | response_ready | unmasking | done
    prompt: '',
    maskInfo: null,
    rawResponse: '',
    upstreamProvider: '',
    error: '',
  };

  root.innerHTML = shell({ user, project, endpoint });
  mount(root, { state, project, endpoint, navigate, localUrl, apiKey, model: defaultModel });

  function shell({ user, project, endpoint }) {
    return `
      <div class="test-shell">
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
              <span>Test · ${escapeHtml(endpoint.name)}</span>
            </nav>
          </div>
          <div class="home-nav-actions">
            <div class="user-chip">
              <div class="user-avatar">${initials(user?.name)}</div>
              <span class="user-name">${escapeHtml(user?.name || 'User')}</span>
            </div>
          </div>
        </nav>

        <div class="test-container">
          <header class="test-header">
            <div>
              <p class="eyebrow">Live wire test</p>
              <h1 class="test-title">Perimeter in motion</h1>
              <p class="test-sub">
                Watch the request get redacted before it reaches the model,
                and the response get reconstructed before it reaches the user.
                Routed through <code>${escapeHtml(endpoint.perimeter_id)}</code>.
              </p>
            </div>
            <div class="test-header-meta">
              <span class="test-pill" id="phase-pill">Idle</span>
            </div>
          </header>

          <div class="test-stage">
            <section class="test-panel" id="panel-left">
              <header class="test-panel-head">
                <span class="test-panel-eyebrow">SOURCE</span>
                <h3 class="test-panel-title" id="left-title">Your prompt</h3>
              </header>
              <div class="test-panel-scroll">
                <pre class="test-text test-text-placeholder" id="left-text">Type a prompt below to begin.</pre>
              </div>
            </section>

            <div class="test-bridge" aria-hidden="true">
              <div class="test-bridge-grid"></div>
              <div class="test-bridge-scan" id="scan"></div>
              <div class="test-bridge-arrow" id="bridge-arrow">›››</div>
              <div class="test-bridge-label" id="bridge-label">Gateway</div>
            </div>

            <section class="test-panel" id="panel-right">
              <header class="test-panel-head">
                <span class="test-panel-eyebrow">DOWNSTREAM</span>
                <h3 class="test-panel-title" id="right-title">What the model sees</h3>
              </header>
              <div class="test-panel-scroll">
                <pre class="test-text test-text-placeholder" id="right-text">Awaiting input.</pre>
              </div>
            </section>
          </div>

          <div id="test-error" class="alert" hidden></div>

          <footer class="test-controls">
            <div class="test-input-wrap">
              <textarea id="prompt-input" class="test-input" rows="3" placeholder="Drop in a message — emails, phones, SSNs, cards, IPs will be redacted before the model sees them."></textarea>
              <button class="test-sample-btn" id="sample-btn">${sampleIcon}<span>Try sample</span></button>
            </div>
            <div class="test-actions">
              <button class="btn btn-primary test-primary-btn" id="primary-btn">
                ${playIcon}<span id="primary-btn-label">Run test</span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  function mount(root, ctx) {
    root.querySelectorAll('[data-link]').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); ctx.navigate(a.getAttribute('href')); });
    });

    const input = root.querySelector('#prompt-input');
    const sampleBtn = root.querySelector('#sample-btn');
    const primaryBtn = root.querySelector('#primary-btn');
    const primaryLabel = root.querySelector('#primary-btn-label');
    const phasePill = root.querySelector('#phase-pill');
    const errorBox = root.querySelector('#test-error');
    const leftTitle = root.querySelector('#left-title');
    const rightTitle = root.querySelector('#right-title');
    const leftEl = root.querySelector('#left-text');
    const rightEl = root.querySelector('#right-text');
    const stage = root.querySelector('.test-stage');
    const bridge = root.querySelector('.test-bridge');

    sampleBtn.addEventListener('click', () => { input.value = SAMPLE_PROMPT; input.focus(); });

    const setPhase = (phase, pillText) => {
      ctx.state.phase = phase;
      phasePill.textContent = pillText;
      phasePill.dataset.phase = phase;
      stage.dataset.phase = phase;
    };

    const showError = (msg) => {
      errorBox.hidden = false;
      errorBox.innerHTML = `${alertIcon}<span>${escapeHtml(msg)}</span>`;
    };
    const clearError = () => { errorBox.hidden = true; errorBox.innerHTML = ''; };

    primaryBtn.addEventListener('click', async () => {
      clearError();

      if (ctx.state.phase === 'idle' || ctx.state.phase === 'done') {
        const text = (input.value || '').trim();
        if (!text) { input.focus(); return; }
        ctx.state.prompt = text;

        // Phase 0: classification + PII detection via the backend (Groq · llama-3.1-8b-instant)
        setPhase('detecting', 'Screening · llama-3.1-8b-instant');
        primaryBtn.disabled = true;
        primaryLabel.textContent = 'Screening…';
        let detectionRes;
        try {
          detectionRes = await api.maskText(text, ctx.endpoint.id);
        } catch (err) {
          showError(err.message || 'PII detection failed');
          setPhase('idle', 'Idle');
          primaryBtn.disabled = false;
          primaryLabel.textContent = 'Try again';
          return;
        }

        // Branch: blocked request
        if (detectionRes.blocked) {
          await runBlockedPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel, text, detectionRes.blocked);
          return;
        }

        ctx.state.maskInfo = buildMaskInfo(text, detectionRes);

        // Phase 1: masking animation
        await runMaskingPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel);
        // Phase 2: send to model
        await runSendPhase(ctx, setPhase, primaryBtn, primaryLabel, showError);
        // Wait for user click to view response
        return;
      }

      if (ctx.state.phase === 'response_ready') {
        await runUnmaskPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel);
        return;
      }
    });

    // Initial focus + autofill sample for the demo
    input.value = SAMPLE_PROMPT;
    input.focus();
  }

  async function runBlockedPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel, text, blocked) {
    setPhase('blocked', `Blocked · ${blocked.reason.replace(/_/g, ' ').toLowerCase()}`);
    primaryBtn.disabled = true;
    primaryLabel.textContent = 'Blocked';

    leftTitle.textContent = 'Suspicious input';
    rightTitle.textContent = 'Gateway response';
    bridge.querySelector('#bridge-label').textContent = 'Policy · denied';

    // LEFT: full prompt, slightly muted and locked
    leftEl.classList.remove('test-text-placeholder');
    leftEl.innerHTML = `<span class="blocked-input">${escapeHtml(text)}</span>`;
    await sleep(180);

    // Red sweep across the bridge — done via stage data-phase
    await sleep(400);

    // RIGHT: dramatic block card
    rightEl.classList.remove('test-text-placeholder');
    rightEl.innerHTML = `
      <div class="block-card">
        <div class="block-card-icon">${shieldStopIcon}</div>
        <div class="block-card-reason">${escapeHtml(blocked.reason.replace(/_/g, ' '))}</div>
        <h3 class="block-card-title">Request blocked</h3>
        <p class="block-card-cause">${escapeHtml(blocked.message)}</p>
        <div class="block-card-divider"></div>
        <p class="block-card-eyebrow">Returned to caller</p>
        <p class="block-card-response" id="block-response"></p>
      </div>
    `;
    // Typewrite the restricted response
    const respEl = rightEl.querySelector('#block-response');
    await typewriteText(respEl, blocked.restricted_response, 8);

    setPhase('done', 'Complete · blocked');
    primaryBtn.disabled = false;
    primaryLabel.textContent = 'Run again';
  }

  async function runMaskingPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel) {
    setPhase('masking', 'Redacting');
    primaryBtn.disabled = true;
    primaryLabel.textContent = 'Redacting…';

    leftTitle.textContent = 'Your prompt';
    rightTitle.textContent = 'What the model sees';
    bridge.querySelector('#bridge-label').textContent = 'Redaction · in';

    // LEFT: show original text with PII highlights all at once
    leftEl.classList.remove('test-text-placeholder');
    leftEl.innerHTML = ctx.state.maskInfo.leftHtml;
    await sleep(220);

    // Pulse the PII highlights in sequence
    const piiEls = leftEl.querySelectorAll('.pii');
    for (const el of piiEls) {
      el.classList.add('pii-active');
      await sleep(120);
    }

    // RIGHT: stream the masked version
    rightEl.classList.remove('test-text-placeholder');
    rightEl.innerHTML = '';
    await animateForwardReveal(rightEl, ctx.state.maskInfo.segments);

    await sleep(200);
  }

  async function runSendPhase(ctx, setPhase, primaryBtn, primaryLabel, showError) {
    setPhase('sending', 'Routing through perimeter');
    primaryBtn.disabled = true;
    primaryLabel.textContent = 'Routing…';

    try {
      const body = {
        model: ctx.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: ctx.state.maskInfo.masked },
        ],
        max_tokens: 400,
        temperature: 0.4,
      };
      const res = await fetch(`${ctx.localUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.detail || data?.error?.message || `Proxy returned ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      ctx.state.rawResponse = data?.choices?.[0]?.message?.content || '(no content)';
      ctx.state.upstreamProvider = res.headers.get('x-watchtower-provider') || '';
      const evtIdHdr = res.headers.get('x-watchtower-event-id');
      ctx.state.eventId = evtIdHdr ? Number(evtIdHdr) : null;
    } catch (err) {
      showError(err.message || 'Proxy call failed');
      setPhase('idle', 'Idle');
      primaryBtn.disabled = false;
      primaryLabel.textContent = 'Try again';
      return;
    }

    setPhase('response_ready', `Response received · ${ctx.state.upstreamProvider || 'upstream'}`);
    primaryBtn.disabled = false;
    primaryLabel.textContent = 'View response';
  }

  async function runUnmaskPhase(ctx, leftEl, rightEl, leftTitle, rightTitle, setPhase, bridge, primaryBtn, primaryLabel) {
    setPhase('unmasking', 'Re-identifying');
    primaryBtn.disabled = true;
    primaryLabel.textContent = 'Re-identifying…';

    leftTitle.textContent = 'Model response · still redacted';
    rightTitle.textContent = 'What the user sees';
    bridge.querySelector('#bridge-label').textContent = 'Re-identification · out';

    const { tokenMap } = ctx.state.maskInfo;
    const unmaskInfo = unmaskWithSegments(ctx.state.rawResponse, tokenMap);

    // LEFT: show raw response (with tokens highlighted)
    leftEl.classList.remove('test-text-placeholder');
    leftEl.innerHTML = unmaskInfo.leftHtml;
    await sleep(220);

    // Pulse tokens in sequence
    const tokEls = leftEl.querySelectorAll('.tok');
    for (const el of tokEls) {
      el.classList.add('tok-active');
      await sleep(140);
    }

    // RIGHT: stream the user-facing response, decoding tokens back to originals
    rightEl.classList.remove('test-text-placeholder');
    rightEl.innerHTML = '';
    await animateReverseReveal(rightEl, unmaskInfo.segments);

    setPhase('done', 'Complete');
    primaryBtn.disabled = false;
    primaryLabel.textContent = 'Run again';

    // Persist the user-facing output to the audit trail.
    if (ctx.state.eventId) {
      const finalText = rightEl.textContent || '';
      api.finalizeEvent(ctx.state.eventId, finalText).catch(() => {});
    }
  }
}
