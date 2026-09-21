// ═══════════════════════════════════════════════
// ChessCF — Voice Signal Worker
// Handles WebRTC signaling via Cloudflare Calls API.
// Clients do SDP offer/answer + ICE here,
// then audio flows P2P through CF TURN servers.
// ═══════════════════════════════════════════════

const CF_CALLS_API = 'https://rtc.live.cloudflare.com/v1';

export async function handleVoiceSession(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

  // Create or retrieve CF Calls session for this game room
  const sessionKey = `voice_session:${gameId}`;
  let session = await env.KV.get(sessionKey, 'json');

  if (!session) {
    // Create new CF Calls room
    const res = await fetch(`${CF_CALLS_API}/apps/${env.CF_CALLS_APP_ID}/sessions/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CF_CALLS_APP_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    session = { sessionId: data.sessionId, gameId };
    await env.KV.put(sessionKey, JSON.stringify(session), { expirationTtl: 7200 }); // 2h TTL
  }

  return Response.json({
    sessionId: session.sessionId,
    appId: env.CF_CALLS_APP_ID,
    // Client uses sessionId to connect via @cloudflare/calls-sdk
  });
}

// POST /api/voice/offer — relay SDP offer to the other player
export async function handleVoiceOffer(request, env) {
  const { gameId, userId, sdp } = await request.json();
  const key = `voice_offer:${gameId}:${userId}`;
  await env.KV.put(key, JSON.stringify({ sdp, ts: Date.now() }), { expirationTtl: 120 });
  return Response.json({ ok: true });
}

// GET /api/voice/offer — poll for pending offer
export async function handleVoicePoll(request, env) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get('gameId');
  const userId = url.searchParams.get('userId');
  const forUser = url.searchParams.get('for'); // the other player's ID
  const key = `voice_offer:${gameId}:${forUser}`;
  const offer = await env.KV.get(key, 'json');
  if (!offer) return Response.json({ pending: true });
  await env.KV.delete(key);
  return Response.json({ offer });
}