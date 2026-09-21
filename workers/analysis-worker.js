// ═══════════════════════════════════════════════
// ChessCF — Analysis Queue Consumer (Agent Training)
// Triggered by CF Queues after every game.
// Analyzes moves, finds blunders, updates Agent DO.
// ═══════════════════════════════════════════════

export async function handleAnalysisQueue(batch, env) {
  for (const message of batch.messages) {
    try {
      await processGame(message.body, env);
      message.ack();
    } catch (e) {
      console.error('Analysis failed:', e);
      message.retry();
    }
  }
}

async function processGame({ gameId, agentId, pgn, result, level }, env) {
  if (!agentId || !pgn || !env.AGENT_DO) return;

  // Parse PGN to get move count
  const moves = pgn.split(/s+/).filter(m => m && !/^d+./.test(m));
  const totalMoves = moves.length;

  // Simulate blunder detection (in production: run Stockfish WASM)
  // For now: estimate blunders based on game result and level
  const blunderRate = result === 'agent_loss' ? 0.12 + Math.random() * 0.08 : 0.05 + Math.random() * 0.05;
  const blunders = Math.floor(totalMoves * blunderRate);

  // Fetch opponent ELO if available
  let opponentElo = 1200;
  if (gameId && env.DB) {
    const game = await env.DB.prepare('SELECT white_id FROM games WHERE id = ?').bind(gameId).first();
    if (game) {
      const player = await env.DB.prepare('SELECT elo FROM users WHERE id = ?').bind(game.white_id).first();
      if (player) opponentElo = player.elo;
    }
  }

  // Call Agent Memory DO to apply training
  const agentDOId = env.AGENT_DO.idFromName(agentId);
  const agentStub = env.AGENT_DO.get(agentDOId);
  await agentStub.fetch(new Request(`http://internal/train?id=${agentId}`, {
    method: 'POST',
    body: JSON.stringify({ blunders, totalMoves, result, opponentElo }),
    headers: { 'Content-Type': 'application/json' },
  }));

  // Update agent stats in D1
  if (env.DB) {
    const win  = result === 'agent_win'  ? 1 : 0;
    const loss = result === 'agent_loss' ? 1 : 0;
    const draw = result === 'draw'       ? 1 : 0;
    await env.DB.prepare(
      'UPDATE agents SET games_played=games_played+1, wins=wins+?, losses=losses+?, draws=draws+?, improvement_score=improvement_score+?, updated_at=datetime("now") WHERE id=?'
    ).bind(win, loss, draw, blunders > 3 ? 1 : 0.5, agentId).run();
  }

  console.log(`[Analysis] Game ${gameId}: agent=${agentId} result=${result} blunders=${blunders}/${totalMoves}`);
}