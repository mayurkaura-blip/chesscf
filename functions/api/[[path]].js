// ═══════════════════════════════════════════════
// ChessCF — Main API Router (Pages Function)
// functions/api/[[path]].js
// Handles ALL /api/* requests.
// ═══════════════════════════════════════════════

// DO class exports (required for wrangler to pick them up)
export { GameRoomDO }   from '../../workers/game-room-do.js';
export { AgentMemoryDO } from '../../workers/agent-do.js';
export { LeaderboardDO } from '../../workers/leaderboard-do.js';
export { ChatRoomDO }   from '../../workers/chat-do.js';
export { PresenceDO }   from '../../workers/presence-do.js';

// Queue consumer
export { handleAnalysisQueue as queue } from '../../workers/analysis-worker.js';

import {
  handleRegister, handleLogin, handleLogout, handleMe,
  handleGoogleRedirect, handleGoogleCallback,
  handleFacebookRedirect, handleFacebookCallback,
  validateSession, getTokenFromRequest, json, err, CORS,
} from '../../workers/auth.js';

import {
  handleVoiceSession, handleVoiceOffer, handleVoicePoll,
} from '../../workers/voice.js';

// ── CORS preflight ────────────────────────────────
function corsOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── Leaderboard API ───────────────────────────────
async function handleLeaderboard(request, env) {
  const url    = new URL(request.url);
  const level  = url.searchParams.get('level') || '1';
  const page   = parseInt(url.searchParams.get('page') || '1');

  // Try KV cache (30s)
  const cacheKey = `leaderboard:${level}:${page}`;
  const cached = await env.KV?.get(cacheKey, 'json');
  if (cached) return json(cached);

  // Try Leaderboard DO for live data
  if (env.LEADERBOARD_DO) {
    const doId = env.LEADERBOARD_DO.idFromName(`level-${level}`);
    const stub = env.LEADERBOARD_DO.get(doId);
    const res = await stub.fetch(new Request(`http://internal/top?level=${level}`));
    const data = await res.json();
    await env.KV?.put(cacheKey, JSON.stringify(data), { expirationTtl: 30 });
    return json(data);
  }

  // Fallback: direct D1 query
  if (!env.DB) return json({ players: [] });
  const col = `elo_${level}`;
  const rows = await env.DB.prepare(
    `SELECT handle, ${col} as elo, wins, losses, draws, country
     FROM users ORDER BY ${col} DESC LIMIT 15 OFFSET ?`
  ).bind((page - 1) * 15).all();
  const players = (rows.results || []).map((r, i) => ({
    rank: (page - 1) * 15 + i + 1,
    handle: r.handle, elo: r.elo,
    games: r.wins + r.losses + r.draws,
    wins: r.wins, losses: r.losses, draws: r.draws,
    country: r.country || '🌍', streak: 0,
  }));
  return json({ players });
}

// ── Profile API ───────────────────────────────────
async function handleProfile(request, env, handle) {
  if (!handle) return err('Handle required');
  const user = await env.DB?.prepare(
    'SELECT handle, elo, elo_1,elo_2,elo_3,elo_4,elo_5, wins, losses, draws, created_at FROM users WHERE handle = ?'
  ).bind(handle).first();
  if (!user) return err('Player not found', 404);
  return json({ user });
}

// ── Game WS upgrade ───────────────────────────────
async function handleGameWS(request, env) {
  if (!env.GAME_ROOM) return err('Game Room DO not configured', 503);
  const url     = new URL(request.url);
  const gameId  = url.searchParams.get('gameId') || crypto.randomUUID();
  const doId    = env.GAME_ROOM.idFromName(gameId);
  const stub    = env.GAME_ROOM.get(doId);
  return stub.fetch(request);
}

// ── Chat WS upgrade ───────────────────────────────
async function handleChatWS(request, env) {
  if (!env.CHAT_ROOM) return err('Chat Room DO not configured', 503);
  const url    = new URL(request.url);
  const roomId = url.searchParams.get('roomId') || 'lobby';
  const doId   = env.CHAT_ROOM.idFromName(roomId);
  const stub   = env.CHAT_ROOM.get(doId);
  return stub.fetch(request);
}

// ── Presence WS upgrade ───────────────────────────
async function handlePresenceWS(request, env) {
  if (!env.PRESENCE_DO) return err('Presence DO not configured', 503);
  const doId = env.PRESENCE_DO.idFromName('lobby');
  const stub = env.PRESENCE_DO.get(doId);
  return stub.fetch(request);
}

// ── Agent API ─────────────────────────────────────
async function handleAgents(request, env) {
  const agents = await env.DB?.prepare('SELECT * FROM agents ORDER BY level ASC').all();
  return json({ agents: agents?.results || [] });
}

// ── Update ELO after game ─────────────────────────
async function handleGameResult(request, env) {
  const user = await validateSession(getTokenFromRequest(request), env);
  if (!user) return err('Unauthorized', 401);

  const { gameId, result, level, agentId, pgn } = await request.json();
  const delta = result === 'win' ? 15 : result === 'loss' ? -15 : 3;
  const newElo = Math.max(100, user.elo + delta);
  const col = `elo_${Math.min(5, Math.max(1, level || 1))}`;

  if (env.DB) {
    const winCol  = result === 'win'  ? 'wins=wins+1'  : result === 'loss' ? 'losses=losses+1' : 'draws=draws+1';
    await env.DB.prepare(
      `UPDATE users SET elo=?, ${col}=?, ${winCol}, last_seen=datetime('now') WHERE id=?`
    ).bind(newElo, newElo, user.id).run();

    // Log game
    if (gameId) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO games (id, white_id, level, agent_id, result, pgn, ended_at) VALUES (?,?,?,?,?,?,datetime("now"))'
      ).bind(gameId, user.id, level, agentId, result, pgn || '').run();
    }
  }

  // Update leaderboard DO
  if (env.LEADERBOARD_DO && level) {
    const doId = env.LEADERBOARD_DO.idFromName(`level-${level}`);
    const stub = env.LEADERBOARD_DO.get(doId);
    await stub.fetch(new Request('http://internal/update', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, handle: user.handle, level, newElo, result }),
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  // Queue analysis
  if (env.ANALYSIS_QUEUE && agentId) {
    await env.ANALYSIS_QUEUE.send({ gameId, agentId, pgn: pgn || '', result, level });
  }

  return json({ newElo, delta });
}

// ═══════════════════════════════════════════════
// MAIN ROUTER
// ═══════════════════════════════════════════════

export async function onRequest(ctx) {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') return corsOptions();

  const url  = new URL(request.url);
  const path = url.pathname.replace('/api/', '').replace(/^\//, '');

  try {
    // ── Auth routes ──
    if (path === 'auth/register')         return handleRegister(request, env);
    if (path === 'auth/login')            return handleLogin(request, env);
    if (path === 'auth/logout')           return handleLogout(request, env);
    if (path === 'auth/me')               return handleMe(request, env);
    if (path === 'auth/google')           return handleGoogleRedirect(request, env);
    if (path === 'auth/google/callback')  return handleGoogleCallback(request, env);
    if (path === 'auth/facebook')         return handleFacebookRedirect(request, env);
    if (path === 'auth/facebook/callback')return handleFacebookCallback(request, env);

    // ── Game routes ──
    if (path === 'game/ws')    return handleGameWS(request, env);
    if (path === 'game/result' && request.method === 'POST') return handleGameResult(request, env);

    // ── Leaderboard ──
    if (path === 'leaderboard') return handleLeaderboard(request, env);

    // ── Agents ──
    if (path === 'agents') return handleAgents(request, env);

    // ── Profile ──
    if (path.startsWith('profile/')) return handleProfile(request, env, path.split('/')[1]);

    // ── Chat WS ──
    if (path === 'chat/ws') return handleChatWS(request, env);

    // ── Presence WS ──
    if (path === 'presence/ws') return handlePresenceWS(request, env);

    // ── Voice ──
    if (path === 'voice/session') return handleVoiceSession(request, env);
    if (path === 'voice/offer')   return request.method === 'POST' ? handleVoiceOffer(request, env) : handleVoicePoll(request, env);

    // Health check
    if (path === 'health') return json({ ok: true, ts: new Date().toISOString(), env: env.ENVIRONMENT });

    return err('Not found', 404);
  } catch (e) {
    console.error('[API Error]', e);
    return err('Internal server error', 500);
  }
}