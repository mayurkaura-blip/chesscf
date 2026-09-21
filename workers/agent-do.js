// ═══════════════════════════════════════════════
// ChessCF — Agent Memory Durable Object
// One per AI agent (5 at MVP).
// Stores: style weights, opponent patterns, weaknesses.
// Evolves after every game via CF Queue → Analysis Worker → this DO.
// ═══════════════════════════════════════════════

const DEFAULT_AGENTS = {
  'pawn-e':      { aggression:0.20, positional:0.50, random:0.70, fav_opening:'e4' },
  'nightcrawler':{ aggression:0.70, positional:0.30, random:0.20, fav_opening:'c5' },
  'stratbot3':   { aggression:0.40, positional:0.80, random:0.10, fav_opening:'d4' },
  'shadowrook':  { aggression:0.95, positional:0.20, random:0.15, fav_opening:'e4' },
  'apex5':       { aggression:0.50, positional:0.95, random:0.05, fav_opening:'e4' },
};

export class AgentMemoryDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('id') || 'pawn-e';

    // GET /style — return current style weights
    if (url.pathname.endsWith('/style')) {
      const style = await this._getStyle(agentId);
      return Response.json(style);
    }

    // POST /train — update style from analysis result
    if (url.pathname.endsWith('/train') && request.method === 'POST') {
      const payload = await request.json();
      await this._applyTraining(agentId, payload);
      return Response.json({ ok: true });
    }

    // GET /patterns — opponent patterns for a user
    if (url.pathname.endsWith('/patterns')) {
      const userId = url.searchParams.get('userId');
      const patterns = await this.state.storage.get(`patterns:${userId}`) || {};
      return Response.json(patterns);
    }

    // POST /observe — record opponent move tendency
    if (url.pathname.endsWith('/observe') && request.method === 'POST') {
      const { userId, opening, result } = await request.json();
      await this._recordOpponentPattern(userId, opening, result);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  async _getStyle(agentId) {
    const stored = await this.state.storage.get(`style:${agentId}`);
    return stored || DEFAULT_AGENTS[agentId] || DEFAULT_AGENTS['pawn-e'];
  }

  async _applyTraining(agentId, { blunders, totalMoves, result, opponentElo }) {
    const style = await this._getStyle(agentId);

    // Learning rate: small deltas so agent improves gradually
    const lr = 0.02;
    let { aggression, positional, random } = style;

    // If agent lost with aggressive play → tone down aggression
    if (result === 'loss' && aggression > 0.5) aggression = Math.max(0.1, aggression - lr);
    // If blunder rate is high → increase positional (more careful)
    const blunderRate = totalMoves > 0 ? blunders / totalMoves : 0;
    if (blunderRate > 0.15) positional = Math.min(0.99, positional + lr * 2);
    // Reduce randomness as ELO increases
    if (opponentElo > 1400) random = Math.max(0.02, random - lr * 0.5);
    // If agent won → slightly reinforce current style
    if (result === 'win') {
      aggression = Math.min(0.99, aggression + lr * 0.5);
      positional = Math.min(0.99, positional + lr * 0.5);
    }

    const newStyle = { ...style, aggression, positional, random, last_trained: new Date().toISOString() };
    await this.state.storage.put(`style:${agentId}`, newStyle);

    // Persist to D1 every 10 updates
    const trainCount = (await this.state.storage.get('train_count') || 0) + 1;
    await this.state.storage.put('train_count', trainCount);
    if (trainCount % 10 === 0 && this.env.DB) {
      await this.env.DB.prepare(
        'UPDATE agents SET style_aggression=?, style_positional=?, style_random=?, last_trained_at=datetime("now") WHERE id=?'
      ).bind(aggression, positional, random, agentId).run();
    }

    return newStyle;
  }

  async _recordOpponentPattern(userId, opening, result) {
    if (!userId) return;
    const key = `patterns:${userId}`;
    const patterns = await this.state.storage.get(key) || {};
    if (!patterns[opening]) patterns[opening] = { count: 0, wins: 0, losses: 0 };
    patterns[opening].count++;
    if (result === 'agent_win') patterns[opening].losses++;
    if (result === 'agent_loss') patterns[opening].wins++;
    await this.state.storage.put(key, patterns);
  }
}