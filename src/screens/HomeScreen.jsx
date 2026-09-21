import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { LEADERBOARD } from '../data/leaderboard'
import { LEVELS } from '../data/levels'
import { AGENTS } from '../data/agents'

const HERO_PIECES = [
  { p:'♔', x:'6%',  y:'22%', d:'7s',  dl:'0s',   color:'#FF6A00' },
  { p:'♛', x:'88%', y:'15%', d:'8.5s',dl:'-2.5s', color:'#00E5FF' },
  { p:'♞', x:'12%', y:'70%', d:'6.5s',dl:'-1.2s', color:'#9B59F5' },
  { p:'♜', x:'84%', y:'62%', d:'9s',  dl:'-3.5s', color:'#00FF88' },
  { p:'♝', x:'3%',  y:'44%', d:'7.5s',dl:'-4.2s', color:'#FF2D7E' },
  { p:'♟', x:'92%', y:'40%', d:'6s',  dl:'-1.8s', color:'#FFD700' },
  { p:'♙', x:'46%', y:'90%', d:'8s',  dl:'-5s',   color:'#FF6A00' },
  { p:'♘', x:'55%', y:'4%',  d:'7.2s',dl:'-2.2s', color:'#00E5FF' },
]

const STATS = [
  { num:'14,200+', label:'Active Players', live:true },
  { num:'2.8M',    label:'Games Played',   live:false },
  { num:'190+',    label:'Countries',      live:false },
  { num:'330+',    label:'CF Global PoPs', live:false },
]

const FEATURES = [
  { icon:'🤖', title:'5 AI Agents',         desc:'Named, self-improving AI agents that learn from every game. PAWN-E to APEX-5 — each evolves its playstyle based on thousands of matches.', tag:'Workers AI + GPT-4o', color:'#FF6A00' },
  { icon:'🌐', title:'Live Multiplayer',     desc:'Challenge players globally via ELO matchmaking. Durable Objects guarantee real-time move sync with <10ms latency at any Cloudflare PoP.', tag:'Durable Objects', color:'#00E5FF' },
  { icon:'🎤', title:'Voice Chat',           desc:'Real WebRTC voice in every game room — powered by Cloudflare Calls. Push-to-talk, mute, volume controls. Works out of the box.', tag:'Cloudflare Calls', color:'#9B59F5' },
  { icon:'💬', title:'Multi-Room Chat',      desc:'Per-game chat rooms powered by Chat Room Durable Objects. Fan-out to all players and spectators in real-time.', tag:'Chat Room DO', color:'#00FF88' },
  { icon:'📱', title:'Installable PWA',      desc:'Add to your home screen on any device. Works offline, receives push notifications for challenges and opponent moves.', tag:'PWA + Workbox', color:'#FF2D7E' },
  { icon:'🏆', title:'Live Leaderboard',     desc:'Rankings update in real-time — every game result instantly shifts the board. Separate rankings per level, 15 players per tier.', tag:'Live via DO + D1', color:'#FFD700' },
]

const MEDAL = { 1:'🥇', 2:'🥈', 3:'🥉' }
const ROW_CLS = { 1:'lb-row-g', 2:'lb-row-s', 3:'lb-row-b' }

export default function HomeScreen() {
  const { openAuth, authed } = useApp()
  const nav = useNavigate()
  const [activeLevel, setActiveLevel] = useState(1)
  const [onlineCnt, setOnlineCnt] = useState(1247)
  const players = LEADERBOARD[activeLevel] || []
  const level = LEVELS.find(l => l.id === activeLevel)

  // Simulate live counter
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCnt(c => c + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handlePlay = () => authed ? nav('/game') : openAuth('signup')

  const winPct = (p) => Math.round((p.wins / p.games) * 100)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-h1">
        <div className="hero-grid" aria-hidden="true"/>
        <div className="hero-scanline" aria-hidden="true"/>
        <div className="hero-vignette" aria-hidden="true"/>
        <div className="hero-orb hero-orb-1" aria-hidden="true"/>
        <div className="hero-orb hero-orb-2" aria-hidden="true"/>
        <div className="hero-orb hero-orb-3" aria-hidden="true"/>
        {HERO_PIECES.map((pc, i) => (
          <span key={i} className="hero-piece" aria-hidden="true"
            style={{ left:pc.x, top:pc.y, '--d':pc.d, '--dl':pc.dl, color:pc.color }}>
            {pc.p}
          </span>
        ))}

        <div className="hero-content">
          <div className="hero-pill" role="note">
            <span aria-hidden="true">⚡</span>
            chess.mayurdemo.xyz &nbsp;·&nbsp; Powered by Cloudflare
          </div>

          <h1 className="hero-title orb" id="hero-h1">
            <span className="text-grad">Chess at the<br/>Speed of Light</span>
          </h1>

          <p className="hero-sub">
            Battle <strong style={{color:'var(--brand)'}}>5 self-improving AI agents</strong>,
            challenge humans globally with live voice chat, and climb the leaderboard —
            all at Cloudflare's edge network.
          </p>

          <div className="hero-cta">
            <button className="btn btn-brand btn-lg" onClick={handlePlay}>
              ♟ Start Playing Free
            </button>
            <Link to="/agents" className="btn btn-ghost btn-lg">
              Meet the AI Agents →
            </Link>
          </div>

          <div className="hero-trust" role="list">
            <span role="listitem">No credit card</span>
            <span className="hero-dot" aria-hidden="true"/>
            <span role="listitem">5 AI levels</span>
            <span className="hero-dot" aria-hidden="true"/>
            <span role="listitem">Voice chat included</span>
            <span className="hero-dot" aria-hidden="true"/>
            <span role="listitem">PWA — install on phone</span>
          </div>

          <div className="live-ticker" role="status" aria-live="polite">
            <span className="ticker-dot" aria-hidden="true"/>
            {onlineCnt.toLocaleString()} players online right now
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────── */}
      <section className="stats-strip section-border" aria-label="Platform statistics">
        <div className="container">
          <dl className="stats-grid">
            {STATS.map(s => (
              <div key={s.label} className="reveal">
                <dt className="stat-lbl">{s.label}</dt>
                <dd className="stat-num">{s.num}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── LEADERBOARD ──────────────────────────────── */}
      <section className="section section-alt section-border" id="leaderboard" aria-labelledby="lb-h2">
        <div className="container">
          <div className="lb-hdr reveal">
            <div>
              <div className="eyebrow">🏆 Global Rankings</div>
              <h2 className="section-heading orb" id="lb-h2">Top Gamers</h2>
              <p className="section-sub">
                Ranked across 5 difficulty levels · <strong style={{color:'var(--green)'}}>15 players per tier</strong> · Live data
              </p>
            </div>
            <span className="badge badge-green" role="status" aria-live="polite">● LIVE</span>
          </div>

          {/* Level tabs */}
          <div className="lb-tabs reveal" role="tablist" aria-label="Select difficulty level">
            {LEVELS.map(l => (
              <button key={l.id} role="tab" aria-selected={activeLevel===l.id}
                className={`lb-tab${activeLevel===l.id?' active':''}`}
                style={{'--lc': l.color}}
                onClick={() => setActiveLevel(l.id)}>
                <span className="lb-tab-icon" aria-hidden="true">{l.icon}</span>
                <span className="lb-tab-name">{l.name}</span>
              </button>
            ))}
          </div>

          {/* Level description bar */}
          {level && (
            <div className="lb-level-bar reveal">
              <span className="lb-level-bar-icon" aria-hidden="true">{level.icon}</span>
              <div>
                <div className="lb-level-name" style={{color:level.color}}>
                  Level {level.id} — {level.name}
                </div>
                <div className="lb-level-meta">
                  {level.elo} ELO &nbsp;·&nbsp; {level.desc} &nbsp;·&nbsp; AI Agent: <strong style={{color:level.color}}>{level.agent}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="lb-wrap reveal" role="tabpanel">
            <table className="lb-table" aria-label={`${level?.name} leaderboard`}>
              <thead>
                <tr>
                  <th scope="col" className="rank-cell">#</th>
                  <th scope="col">Player</th>
                  <th scope="col" className="tr">ELO</th>
                  <th scope="col" className="tr lb-col-g">Games</th>
                  <th scope="col" className="tr lb-col-w">Wins</th>
                  <th scope="col" className="tr">Win %</th>
                  <th scope="col" className="tr">Streak</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const rank = i + 1
                  const pct  = winPct(p)
                  return (
                    <tr key={p.handle} className={`lb-row ${ROW_CLS[rank]||''}`}>
                      <td className="rank-cell">
                        {rank <= 3
                          ? <span className="rank-medal" aria-label={`Rank ${rank}`}>{MEDAL[rank]}</span>
                          : <span className="rank-num">{rank}</span>}
                      </td>
                      <td>
                        <div className="p-cell">
                          <div className="p-av"
                            style={{background:`linear-gradient(135deg,${p.hue}28,${p.hue}08)`,borderColor:`${p.hue}40`}}
                            aria-hidden="true">{p.piece}</div>
                          <div>
                            <div className="p-handle">@{p.handle}</div>
                            <div className="p-flag" aria-hidden="true">{p.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="tr">
                        <span className="elo-val" style={{color:level?.color}}>{p.elo.toLocaleString()}</span>
                      </td>
                      <td className="tr lb-col-g" style={{color:'var(--text-2)',fontFamily:'var(--fm)',fontSize:'.82rem'}}>
                        {p.games.toLocaleString()}
                      </td>
                      <td className="tr lb-col-w" style={{color:'var(--green)',fontFamily:'var(--fm)',fontSize:'.82rem'}}>
                        {p.wins.toLocaleString()}
                      </td>
                      <td className="tr">
                        <div className="wpc-wrap">
                          <div className="wpc-num">{pct}%</div>
                          <div className="wpc-bg">
                            <div className="wpc-bar" style={{width:`${pct}%`, background:level?.color||'var(--green)'}}/>
                          </div>
                        </div>
                      </td>
                      <td className="tr">
                        <span className="streak-v" style={{color:p.streak>=8?'var(--gold)':p.streak>=5?'var(--brand)':'var(--text-3)'}}>
                          {p.streak>=5?'🔥':''}{p.streak}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="tc reveal" style={{marginTop:24}}>
            <Link to="/lobby" className="btn btn-ghost btn-md">View Full Leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* ── AI AGENTS ────────────────────────────────── */}
      <section className="section section-border" id="agents" aria-labelledby="agents-h2">
        <div className="container">
          <div className="tc reveal">
            <div className="eyebrow" style={{justifyContent:'center'}}>🤖 Self-Improving AI</div>
            <h2 className="section-heading orb" id="agents-h2">Meet the AI Agents</h2>
            <p className="section-sub" style={{margin:'0 auto 8px'}}>
              5 named agents that train after every game — learning your moves, patching their weaknesses,
              and evolving their playstyle. Choose your challenger.
            </p>
          </div>

          <div className="agents-grid">
            {AGENTS.map(a => (
              <div key={a.id} className="agent-card card-neon reveal"
                style={{'--lc':a.color,'--gl':a.gl}}
                onClick={() => authed ? nav(`/game?agent=${a.id}`) : openAuth('signup')}
                role="button" tabIndex={0}
                onKeyDown={e => e.key==='Enter' && (authed?nav(`/game?agent=${a.id}`):openAuth('signup'))}
                aria-label={`Challenge ${a.name}`}>
                <div className="agent-top">
                  <span className="agent-avatar" aria-hidden="true">{a.icon}</span>
                  <div className="agent-elo">
                    <span style={{filter:`drop-shadow(0 0 8px ${a.color})`}}>{a.elo.toLocaleString()}</span>
                    <small>ELO Rating</small>
                  </div>
                </div>
                <div className="agent-name orb" style={{color:a.color}}>{a.name}</div>
                <div className="agent-level">Level {a.level} · {a.style}</div>
                <p className="agent-desc">{a.desc}</p>
                <div className="agent-stats">
                  {[
                    {val:a.games.toLocaleString(), lbl:'Games'},
                    {val:a.wins.toLocaleString(), lbl:'Wins'},
                    {val:Math.round(a.wins/a.games*100)+'%', lbl:'Win Rate'},
                  ].map(s => (
                    <div key={s.lbl} className="agent-stat">
                      <div className="agent-stat-val">{s.val}</div>
                      <div className="agent-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <div className="agent-engine">
                  ⚙ {a.engine}
                  {a.improving && <span className="agent-improving" style={{marginLeft:8}}><span>📈</span> Self-improving</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 LEVELS ─────────────────────────────────── */}
      <section className="section section-alt section-border" id="levels" aria-labelledby="lvl-h2">
        <div className="container tc">
          <div className="eyebrow reveal" style={{justifyContent:'center'}}>🎮 Difficulty System</div>
          <h2 className="section-heading orb reveal" id="lvl-h2">5 Levels — MVP Launch</h2>
          <p className="section-sub reveal" style={{margin:'0 auto'}}>
            Level 1 starts friendly and forgiving — Level 5 will make you sweat.
            Levels 6–10 unlock post-launch.
          </p>

          <div className="levels-grid">
            {LEVELS.map((l, i) => (
              <button key={l.id} className="level-card reveal"
                style={{'--lc':l.color, animationDelay:`${i*60}ms`}}
                onClick={() => authed?nav(`/game?level=${l.id}`):openAuth('signup')}
                aria-label={`Level ${l.id}: ${l.name}, ${l.elo} ELO`}>
                <span className="level-icon" aria-hidden="true">{l.icon}</span>
                <span className="level-num">{l.id}</span>
                <span className="level-name">{l.name}</span>
                <span className="level-elo">{l.elo}</span>
                <span className="level-agent">{l.agent}</span>
              </button>
            ))}
          </div>

          <div className="reveal" style={{marginTop:24}}>
            <button className="btn btn-brand btn-lg" onClick={handlePlay}>
              Choose Your Level — Play Free
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="section section-border" id="features" aria-labelledby="feat-h2">
        <div className="container">
          <div className="tc reveal">
            <div className="eyebrow" style={{justifyContent:'center'}}>⚡ Platform Features</div>
            <h2 className="section-heading orb" id="feat-h2">Everything Included</h2>
            <p className="section-sub" style={{margin:'0 auto'}}>Built entirely on Cloudflare — no external servers, no third-party dependencies.</p>
          </div>
          <div className="feat-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card reveal" style={{'--fc':f.color}}>
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <p className="feat-desc">{f.desc}</p>
                <div className="feat-tag">
                  <span className="feat-dot"/>
                  {f.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="section cta-section section-border">
        <div className="container">
          <div className="cta-orb" aria-hidden="true"/>
          <div className="cta-box reveal">
            <div className="eyebrow" style={{justifyContent:'center'}}>Ready to Battle?</div>
            <h2 className="cta-title orb">
              <span className="text-grad">Start Your First Game</span>
            </h2>
            <p className="cta-sub">
              Create a free account and play in under 60 seconds.
              Your ELO tracks across all 5 difficulty levels.
            </p>
            <div className="cta-actions">
              <button className="btn btn-brand btn-lg" onClick={handlePlay}>♟ Play Free Now</button>
              <Link to="/lobby" className="btn btn-ghost btn-lg">Watch Live Games</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand-name orb">
                <span style={{fontSize:'1.2rem',filter:'drop-shadow(0 0 6px rgba(255,106,0,.5))'}}>♟</span>
                Chess<span style={{color:'var(--brand)'}}>CF</span>
              </div>
              <p className="footer-tagline">Chess at the speed of light. chess.mayurdemo.xyz</p>
            </div>
            {[
              { title:'Play', links:['vs AI Agent','vs Human','Tournaments','Leaderboard'] },
              { title:'Platform', links:['5 AI Levels','Voice Chat','PWA Install','Open Source'] },
              { title:'Company', links:['About','Privacy Policy','Terms of Service','Contact'] },
            ].map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-links">
                  {col.links.map(l => <li key={l}><a href="#" className="footer-link">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2025 ChessCF · chess.mayurdemo.xyz · All rights reserved</p>
            <div className="footer-cf">
              <span>⚡</span>
              Powered by Cloudflare Workers · Durable Objects · CF Calls · Workers AI
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}