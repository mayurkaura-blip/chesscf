// ═══════════════════════════════════════════════
// ChessCF — API Client
// All real API calls go through here.
// In dev: hits localhost:5174/api/*
// In prod: same origin /api/* (CF Pages Functions)
// ═══════════════════════════════════════════════

const BASE = import.meta.env.DEV ? '' : '';  // same origin always

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}/api/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────
export const auth = {
  register:       (body)   => apiFetch('auth/register',       { method:'POST', body: JSON.stringify(body) }),
  login:          (body)   => apiFetch('auth/login',          { method:'POST', body: JSON.stringify(body) }),
  logout:         ()       => apiFetch('auth/logout',         { method:'POST' }),
  me:             ()       => apiFetch('auth/me'),
  googleRedirect: ()       => { window.location.href = '/api/auth/google'; },
  facebookRedirect:()      => { window.location.href = '/api/auth/facebook'; },
};

// ── Leaderboard ───────────────────────────────────
export const leaderboard = {
  get: (level, page = 1) => apiFetch(`leaderboard?level=${level}&page=${page}`),
};

// ── Profile ───────────────────────────────────────
export const profile = {
  get: (handle) => apiFetch(`profile/${handle}`),
};

// ── Game ──────────────────────────────────────────
export const game = {
  submitResult: (body) => apiFetch('game/result', { method:'POST', body: JSON.stringify(body) }),
};

// ── Agents ───────────────────────────────────────
export const agents = {
  list: () => apiFetch('agents'),
};

// ── Health ────────────────────────────────────────
export const health = {
  check: () => apiFetch('health').catch(() => ({ ok: false })),
};
