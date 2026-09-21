// ═══════════════════════════════════════════════
// ChessCF — Auth Worker
// Handles: email register/login, Google OAuth2, Facebook OAuth2
// No third-party — pure Cloudflare Workers + D1 + KV
// ═══════════════════════════════════════════════

// ── Crypto helpers ───────────────────────────────
async function hashPassword(password) {
  const salt = crypto.randomUUID().replace(/-/g, '');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return { hash, salt };
}

async function verifyPassword(password, hash, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256
  );
  const computed = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return computed === hash;
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function generateId() {
  return crypto.randomUUID().replace(/-/g, '');
}

// ── Validation ───────────────────────────────────
function validateHandle(handle) {
  if (!handle || handle.length < 3 || handle.length > 20) return 'Handle must be 3-20 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(handle)) return 'Handle: letters, numbers, underscores only.';
  return null;
}

function validateEmail(email) {
  if (!email || !/^[^@]+@[^@]+.[^@]+$/.test(email)) return 'Valid email required.';
  return null;
}

function validatePassword(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

// ── Session management ───────────────────────────
async function createSession(userId, env, ip, ua) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  // D1: audit trail
  await env.DB.prepare(
    'INSERT INTO sessions (token, user_id, expires_at, ip, ua) VALUES (?, ?, ?, ?, ?)'
  ).bind(token, userId, expiresAt, ip || '', ua || '').run();
  // KV: fast auth check (24h TTL)
  await env.KV.put(`session:${token}`, userId, { expirationTtl: 604800 });
  return token;
}

async function validateSession(token, env) {
  if (!token) return null;
  const userId = await env.KV.get(`session:${token}`);
  if (!userId) return null;
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return user || null;
}

async function deleteSession(token, env) {
  await env.KV.delete(`session:${token}`);
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

// ── Cookie helpers ────────────────────────────────
function setCookieHeader(token, clear = false) {
  if (clear) return 'chesscf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
  return `chesscf_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

function getTokenFromRequest(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/chesscf_session=([^;]+)/);
  if (match) return match[1];
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ── CORS ─────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// ═══════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════

// POST /api/auth/register
export async function handleRegister(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { handle, email, password } = body;
  const he = validateHandle(handle);
  const ee = validateEmail(email);
  const pe = validatePassword(password);
  if (he) return err(he);
  if (ee) return err(ee);
  if (pe) return err(pe);

  // Check uniqueness
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE handle = ? OR email = ?'
  ).bind(handle, email.toLowerCase()).first();
  if (existing) return err('Handle or email already taken.', 409);

  const { hash, salt } = await hashPassword(password);
  const id = generateId();

  await env.DB.prepare(
    'INSERT INTO users (id, handle, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, handle, email.toLowerCase(), hash, salt).run();

  const token = await createSession(id, env,
    request.headers.get('CF-Connecting-IP'),
    request.headers.get('User-Agent')
  );

  const user = { id, handle, email: email.toLowerCase(), elo: 1200, wins: 0, losses: 0, draws: 0 };
  return json({ user, token }, 201, { 'Set-Cookie': setCookieHeader(token) });
}

// POST /api/auth/login
export async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { emailOrHandle, password } = body;
  if (!emailOrHandle || !password) return err('Email/handle and password required.');

  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE (email = ? OR handle = ?) AND provider = "local"'
  ).bind(emailOrHandle.toLowerCase(), emailOrHandle).first();

  if (!user) return err('Invalid credentials.', 401);
  if (!user.password_hash) return err('This account uses social login. Use Google or Facebook.', 401);

  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) return err('Invalid credentials.', 401);

  // Update last_seen
  await env.DB.prepare('UPDATE users SET last_seen = datetime("now") WHERE id = ?').bind(user.id).run();

  const token = await createSession(user.id, env,
    request.headers.get('CF-Connecting-IP'),
    request.headers.get('User-Agent')
  );

  const safe = { id: user.id, handle: user.handle, email: user.email, elo: user.elo, wins: user.wins, losses: user.losses, draws: user.draws };
  return json({ user: safe, token }, 200, { 'Set-Cookie': setCookieHeader(token) });
}

// POST /api/auth/logout
export async function handleLogout(request, env) {
  const token = getTokenFromRequest(request);
  if (token) await deleteSession(token, env);
  return json({ ok: true }, 200, { 'Set-Cookie': setCookieHeader('', true) });
}

// GET /api/auth/me
export async function handleMe(request, env) {
  const token = getTokenFromRequest(request);
  const user = await validateSession(token, env);
  if (!user) return err('Unauthorized', 401);
  const safe = { id: user.id, handle: user.handle, email: user.email, elo: user.elo, wins: user.wins, losses: user.losses, draws: user.draws };
  return json({ user: safe });
}

// ── Google OAuth2 ─────────────────────────────────
// GET /api/auth/google
export async function handleGoogleRedirect(request, env) {
  const state = generateToken();
  await env.KV.put(`oauth_state:${state}`, '1', { expirationTtl: 600 });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${env.SITE_URL}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'offline');
  return Response.redirect(url.toString(), 302);
}

// GET /api/auth/google/callback
export async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return Response.redirect(`${env.SITE_URL}?auth_error=missing_params`, 302);

  // Verify state
  const stateOk = await env.KV.get(`oauth_state:${state}`);
  if (!stateOk) return Response.redirect(`${env.SITE_URL}?auth_error=invalid_state`, 302);
  await env.KV.delete(`oauth_state:${state}`);

  // Exchange code for token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.SITE_URL}/api/auth/google/callback`, grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.id_token) return Response.redirect(`${env.SITE_URL}?auth_error=token_exchange`, 302);

  // Decode id_token (base64 JWT — we trust Google's signature for simplicity)
  const payload = JSON.parse(atob(tokenData.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  const { sub, email, name } = payload;

  // Upsert user
  let user = await env.DB.prepare('SELECT * FROM users WHERE provider_id = ? AND provider = "google"').bind(sub).first();
  if (!user) {
    user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  }

  let userId;
  let isNew = false;
  if (!user) {
    isNew = true;
    userId = generateId();
    const baseHandle = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
    let handle = baseHandle;
    let attempt = 0;
    while (true) {
      const exists = await env.DB.prepare('SELECT id FROM users WHERE handle = ?').bind(handle).first();
      if (!exists) break;
      handle = `${baseHandle}_${Math.floor(Math.random()*999)}`;
      if (++attempt > 10) { handle = `user_${userId.slice(0,8)}`; break; }
    }
    await env.DB.prepare(
      'INSERT INTO users (id, handle, email, provider, provider_id, verified) VALUES (?, ?, ?, "google", ?, 1)'
    ).bind(userId, handle, email.toLowerCase(), sub).run();
  } else {
    userId = user.id;
    if (!user.provider_id) {
      await env.DB.prepare('UPDATE users SET provider_id = ?, provider = "google", verified = 1 WHERE id = ?').bind(sub, userId).run();
    }
  }

  const token = await createSession(userId, env, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));
  const redirect = isNew
    ? `${env.SITE_URL}?sso=google&new=1&token=${token}`
    : `${env.SITE_URL}?sso=google&token=${token}`;
  return new Response(null, { status: 302, headers: { Location: redirect, 'Set-Cookie': setCookieHeader(token) } });
}

// ── Facebook OAuth2 ───────────────────────────────
// GET /api/auth/facebook
export async function handleFacebookRedirect(request, env) {
  const state = generateToken();
  await env.KV.put(`oauth_state:${state}`, '1', { expirationTtl: 600 });
  const url = new URL('https://www.facebook.com/dialog/oauth');
  url.searchParams.set('client_id', env.FB_APP_ID);
  url.searchParams.set('redirect_uri', `${env.SITE_URL}/api/auth/facebook/callback`);
  url.searchParams.set('scope', 'email,public_profile');
  url.searchParams.set('state', state);
  return Response.redirect(url.toString(), 302);
}

// GET /api/auth/facebook/callback
export async function handleFacebookCallback(request, env) {
  const url = new URL(request.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return Response.redirect(`${env.SITE_URL}?auth_error=missing_params`, 302);

  const stateOk = await env.KV.get(`oauth_state:${state}`);
  if (!stateOk) return Response.redirect(`${env.SITE_URL}?auth_error=invalid_state`, 302);
  await env.KV.delete(`oauth_state:${state}`);

  // Exchange code for access_token
  const tokenRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?client_id=${env.FB_APP_ID}&client_secret=${env.FB_APP_SECRET}&redirect_uri=${encodeURIComponent(env.SITE_URL + '/api/auth/facebook/callback')}&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return Response.redirect(`${env.SITE_URL}?auth_error=token_exchange`, 302);

  // Fetch profile
  const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
  const profile = await profileRes.json();
  const { id: fbId, name, email } = profile;

  let user = await env.DB.prepare('SELECT * FROM users WHERE provider_id = ? AND provider = "facebook"').bind(fbId).first();
  if (!user && email) {
    user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  }

  let userId;
  let isNew = false;
  if (!user) {
    isNew = true;
    userId = generateId();
    const baseHandle = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
    let handle = baseHandle;
    let attempt = 0;
    while (true) {
      const exists = await env.DB.prepare('SELECT id FROM users WHERE handle = ?').bind(handle).first();
      if (!exists) break;
      handle = `${baseHandle}_${Math.floor(Math.random()*999)}`;
      if (++attempt > 10) { handle = `user_${userId.slice(0,8)}`; break; }
    }
    await env.DB.prepare(
      'INSERT INTO users (id, handle, email, provider, provider_id, verified) VALUES (?, ?, ?, "facebook", ?, 1)'
    ).bind(userId, handle, (email || `${fbId}@facebook.com`).toLowerCase(), fbId).run();
  } else {
    userId = user.id;
    if (!user.provider_id) {
      await env.DB.prepare('UPDATE users SET provider_id = ?, provider = "facebook", verified = 1 WHERE id = ?').bind(fbId, userId).run();
    }
  }

  const token = await createSession(userId, env, request.headers.get('CF-Connecting-IP'), request.headers.get('User-Agent'));
  const redirect = isNew
    ? `${env.SITE_URL}?sso=facebook&new=1&token=${token}`
    : `${env.SITE_URL}?sso=facebook&token=${token}`;
  return new Response(null, { status: 302, headers: { Location: redirect, 'Set-Cookie': setCookieHeader(token) } });
}

export { validateSession, getTokenFromRequest, json, err, CORS };