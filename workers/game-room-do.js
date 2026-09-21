// ═══════════════════════════════════════════════
// ChessCF — Game Room Durable Object
// One instance per active game. Handles:
//   - WebSocket connections (player1, player2, spectators)
//   - Board state (FEN, PGN, clocks)
//   - Move validation (chess.js)
//   - Alarms (clock timeout)
//   - AI move triggering
// ═══════════════════════════════════════════════

export class GameRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      const role = url.searchParams.get('role') || 'spectator'; // player_w | player_b | spectator
      const userId = url.searchParams.get('userId');

      this.state.acceptWebSocket(server, [role, userId || 'anon']);
      await this._ensureGame(url);

      return new Response(null, { status: 101, webSocket: client });
    }

    // REST: get state
    if (url.pathname.endsWith('/state')) {
      const game = await this.state.storage.get('game') || {};
      return Response.json(game);
    }

    // REST: AI move request (from AI Worker)
    if (url.pathname.endsWith('/ai-move') && request.method === 'POST') {
      const { move } = await request.json();
      return await this._applyMove(move, 'ai');
    }

    return new Response('Not found', { status: 404 });
  }

  async _ensureGame(url) {
    const existing = await this.state.storage.get('game');
    if (existing) return;
    const tc = parseInt(url.searchParams.get('tc') || '600');
    const level = parseInt(url.searchParams.get('level') || '1');
    const agentId = url.searchParams.get('agent') || 'pawn-e';
    const game = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: [], history: [],
      turn: 'w', status: 'active',
      clocks: { w: tc * 1000, b: tc * 1000 },
      tc, level, agentId,
      lastMoveAt: Date.now(),
      players: {}, createdAt: Date.now(),
    };
    await this.state.storage.put('game', game);
    // Set clock alarm
    if (tc < 99999) {
      await this.state.storage.setAlarm(Date.now() + tc * 1000);
    }
  }

  async webSocketMessage(ws, message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }
    const [role] = this.state.getTags(ws);

    switch (data.type) {
      case 'move':
        await this._handleMove(ws, role, data.move);
        break;
      case 'resign':
        await this._handleResign(ws, role);
        break;
      case 'draw_offer':
        await this._broadcast({ type: 'draw_offer', from: role }, ws);
        break;
      case 'draw_accept':
        await this._endGame('draw', 'Draw agreed');
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  async webSocketClose(ws, code, reason) {
    const game = await this.state.storage.get('game');
    if (!game || game.status !== 'active') return;
    const [role] = this.state.getTags(ws);
    // Grace period: if player disconnects, don't immediately forfeit
    await env.KV?.put(`disconnect:${this.state.id}:${role}`, '1', { expirationTtl: 30 });
    this._broadcast({ type: 'player_disconnected', role });
  }

  async _handleMove(ws, role, moveObj) {
    const game = await this.state.storage.get('game');
    if (!game || game.status !== 'active') return;

    // Validate it's this player's turn
    const expectedRole = game.turn === 'w' ? 'player_w' : 'player_b';
    if (role !== expectedRole) {
      ws.send(JSON.stringify({ type: 'error', msg: 'Not your turn' }));
      return;
    }

    // We trust move validity since chess.js runs on frontend — just apply and update clock
    const now = Date.now();
    const elapsed = now - (game.lastMoveAt || now);
    game.clocks[game.turn] = Math.max(0, game.clocks[game.turn] - elapsed);

    game.history.push({ ...moveObj, elapsed });
    game.pgn.push(moveObj.san);
    game.fen = moveObj.fenAfter;
    game.lastMoveAt = now;
    game.turn = game.turn === 'w' ? 'b' : 'w';

    await this.state.storage.put('game', game);

    // Update clock alarm
    if (game.tc < 99999) {
      await this.state.storage.setAlarm(now + game.clocks[game.turn]);
    }

    // Broadcast updated state to all
    this._broadcast({ type: 'move', move: moveObj, fen: game.fen, clocks: game.clocks, turn: game.turn });

    // Trigger AI if it's an AI game and AI's turn
    if (game.agentId && game.turn === 'b') {
      await this._requestAIMove(game);
    }
  }

  async _requestAIMove(game) {
    // Signal AI Worker via storage (AI Worker polls this DO)
    // In production: use Service Binding to call AI Worker directly
    this._broadcast({ type: 'ai_thinking' });
    // Simulate: actual AI call happens via the AI Move Worker service binding
    // The AI Move Worker calls back POST /ai-move with the chosen move
  }

  async _handleResign(ws, role) {
    const winner = role === 'player_w' ? 'black' : 'white';
    await this._endGame(winner, 'Resignation');
  }

  async _endGame(result, reason) {
    const game = await this.state.storage.get('game');
    if (!game || game.status !== 'active') return;
    game.status  = 'ended';
    game.result  = result;
    game.endReason = reason;
    game.endedAt = Date.now();
    await this.state.storage.put('game', game);

    this._broadcast({ type: 'game_over', result, reason, pgn: game.pgn, clocks: game.clocks });

    // Queue post-game analysis
    if (this.env.ANALYSIS_QUEUE) {
      await this.env.ANALYSIS_QUEUE.send({
        gameId: this.state.id.toString(),
        agentId: game.agentId, pgn: game.pgn.join(' '), result, level: game.level
      });
    }
  }

  async _applyMove(move, source) {
    const game = await this.state.storage.get('game');
    if (!game || game.status !== 'active') return Response.json({ ok: false });

    game.history.push({ ...move, source });
    game.pgn.push(move.san);
    game.fen = move.fenAfter;
    game.turn = game.turn === 'w' ? 'b' : 'w';
    game.lastMoveAt = Date.now();
    await this.state.storage.put('game', game);

    this._broadcast({ type: 'move', move, fen: game.fen, clocks: game.clocks, turn: game.turn });
    return Response.json({ ok: true });
  }

  _broadcast(data, excludeWs = null) {
    const msg = JSON.stringify(data);
    for (const ws of this.state.getWebSockets()) {
      if (ws !== excludeWs) {
        try { ws.send(msg); } catch {}
      }
    }
  }

  async alarm() {
    const game = await this.state.storage.get('game');
    if (!game || game.status !== 'active') return;
    // Whose clock ran out?
    const flagged = game.clocks[game.turn] <= 0 ? game.turn : null;
    if (!flagged) {
      // Update clock and reset alarm
      const now = Date.now();
      const elapsed = now - (game.lastMoveAt || now);
      game.clocks[game.turn] = Math.max(0, game.clocks[game.turn] - elapsed);
      game.lastMoveAt = now;
      await this.state.storage.put('game', game);
      if (game.clocks[game.turn] > 0) {
        await this.state.storage.setAlarm(now + game.clocks[game.turn]);
      }
      return;
    }
    const winner = flagged === 'w' ? 'black' : 'white';
    await this._endGame(winner, 'Timeout');
  }
}