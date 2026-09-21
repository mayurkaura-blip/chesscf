// ═══════════════════════════════════════════════
// ChessCF — Chat Room Durable Object
// One per game + lobby. Fan-out to all members.
// Stores last 100 messages for reconnection.
// ═══════════════════════════════════════════════

export class ChatRoomDO {
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

      // Send recent history
      const history = await this.state.storage.get('history') || [];
      server.send(JSON.stringify({ type: 'history', messages: history }));
      return new Response(null, { status: 101, webSocket: client });
    }

    return Response.json({ error: 'WebSocket required' }, { status: 426 });
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    const tags = this.state.getTags(ws);
    const handle = tags[1] || 'Player';

    if (data.type !== 'message') return;
    if (!data.text?.trim()) return;

    // Moderate: strip anything that looks like XSS
    const text = data.text.trim().slice(0, 500).replace(/[<>]/g, '');
    const msg = { id: Date.now(), handle, text, ts: new Date().toISOString() };

    // Store in history (last 100)
    const history = await this.state.storage.get('history') || [];
    history.push(msg);
    if (history.length > 100) history.shift();
    await this.state.storage.put('history', history);

    // Fan-out to all WebSockets
    const out = JSON.stringify({ type: 'message', ...msg });
    for (const s of this.state.getWebSockets()) {
      try { s.send(out); } catch {}
    }
  }

  async webSocketClose(ws, code) {
    const tags = this.state.getTags(ws);
    const handle = tags[1] || 'Player';
    const left = JSON.stringify({ type: 'system', text: `${handle} left the chat.`, ts: new Date().toISOString() });
    for (const s of this.state.getWebSockets()) {
      if (s !== ws) try { s.send(left); } catch {}
    }
  }
}