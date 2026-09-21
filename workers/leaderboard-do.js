// ═══════════════════════════════════════════════
// ChessCF — Leaderboard Durable Object
// One per level (5 at MVP).
// Holds top-15 in memory, broadcasts on every ELO update.
// ═══════════════════════════════════════════════

export class LeaderboardDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket: live leaderboard updates
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server, ['viewer']);
      // Send current top-15 immediately
      const top = await this._getTop(url.searchParams.get('level') || '1');
      server.send(JSON.stringify({ type: 'init', players: top }));
      return new Response(null, { status: 101, webSocket: client });
    }

    // GET /top?level=N
    if (url.pathname.endsWith('/top')) {
      const level = url.searchParams.get('level') || '1';
      const top = await this._getTop(level);
      return Response.json({ players: top, updatedAt: new Date().toISOString() });
    }

    // POST /update — called by Game API Worker after game ends
    if (url.pathname.endsWith('/update') && request.method === 'POST') {
      const payload = await request.json();
      await this._applyResult(payload);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  async _getTop(level) {
    // Try in-memory cache first
    const cached = await this.state.storage.get(`top:${level}`);
    if (cached) return cached;
    // Fall back to D1
    if (!this.env.DB) return [];
    const col = `elo_${level}`;
    const rows = await this.env.DB.prepare(
      `SELECT handle, elo, ${col} as level_elo, wins, losses, draws, country
       FROM users ORDER BY ${col} DESC LIMIT 15`
    ).all();
    const top = (rows.results || []).map((r, i) => ({
      rank: i + 1, handle: r.handle, elo: r.level_elo || r.elo,
      games: r.wins + r.losses + r.draws,
      wins: r.wins, losses: r.losses, draws: r.draws,
      country: r.country || '🌍', streak: 0,
    }));
    await this.state.storage.put(`top:${level}`, top, { expirationTtl: 30 });
    return top;
  }

  async _applyResult({ userId, handle, level, newElo, result }) {
    const key = `top:${level}`;
    let top = await this.state.storage.get(key) || [];

    const idx = top.findIndex(p => p.handle === handle);
    if (idx >= 0) {
      top[idx].elo = newElo;
      if (result === 'win') top[idx].wins++;
      else if (result === 'loss') top[idx].losses++;
      else top[idx].draws++;
      top[idx].games = top[idx].wins + top[idx].losses + top[idx].draws;
    } else {
      // Player not in top-15 yet — check if they should be
      if (top.length < 15 || newElo > (top[top.length - 1]?.elo || 0)) {
        top.push({ handle, elo: newElo, wins: result === 'win' ? 1 : 0, losses: result === 'loss' ? 1 : 0, draws: result === 'draw' ? 1 : 0, games: 1, country: '🌍', streak: 0 });
      }
    }

    // Re-sort and trim to 15
    top.sort((a, b) => b.elo - a.elo);
    top = top.slice(0, 15).map((p, i) => ({ ...p, rank: i + 1 }));
    await this.state.storage.put(key, top);

    // Broadcast live update to all connected viewers
    const delta = { type: 'update', handle, newElo, result, level, players: top };
    for (const ws of this.state.getWebSockets('viewer')) {
      try { ws.send(JSON.stringify(delta)); } catch {}
    }
  }

  async webSocketClose(ws) {
    ws.close(1000);
  }
}