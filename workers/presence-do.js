// ═══════════════════════════════════════════════
// ChessCF — Player Presence Durable Object
// Tracks online/in-game/away status for lobby.
// ═══════════════════════════════════════════════

export class PresenceDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      const userId = url.searchParams.get('userId') || 'anon';
      const handle = url.searchParams.get('handle') || 'Player';
      this.state.acceptWebSocket(server, [userId, handle]);

      // Mark as online
      await this.state.storage.put(`online:${userId}`, { handle, status: 'online', ts: Date.now() });
      this._broadcast({ type: 'joined', handle });

      // Send current online list
      const list = await this._getOnlineList();
      server.send(JSON.stringify({ type: 'presence_list', players: list }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith('/online')) {
      const list = await this._getOnlineList();
      return Response.json({ players: list });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  async _getOnlineList() {
    const entries = await this.state.storage.list({ prefix: 'online:' });
    return Array.from(entries.values());
  }

  _broadcast(data, exclude = null) {
    const msg = JSON.stringify(data);
    for (const ws of this.state.getWebSockets()) {
      if (ws !== exclude) try { ws.send(msg); } catch {}
    }
  }

  async webSocketClose(ws) {
    const [userId, handle] = this.state.getTags(ws);
    await this.state.storage.delete(`online:${userId}`);
    this._broadcast({ type: 'left', handle });
  }
}