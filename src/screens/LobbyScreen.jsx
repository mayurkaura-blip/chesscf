import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { LEADERBOARD } from '../data/leaderboard'
import { LEVELS } from '../data/levels'

const MOCK_ROOMS = [
  { id:1, white:'TacticsKing', black:'???', tc:'5+3', level:5, status:'waiting', moves:0, elo:'1748 vs ???' },
  { id:2, white:'NoviceNate',  black:'PawnAdvance', tc:'10+0', level:2, status:'playing', moves:24, elo:'947 vs 934' },
  { id:3, white:'ApprenticeX', black:'ForkSpecialist', tc:'3+0', level:3, status:'playing', moves:41, elo:'1098 vs 1084' },
  { id:4, white:'WeekendPlayer', black:'???', tc:'1+0', level:4, status:'waiting', moves:0, elo:'1247 vs ???' },
  { id:5, white:'CalcBetter5', black:'OpeningBook5', tc:'15+10', level:5, status:'playing', moves:12, elo:'1731 vs 1714' },
  { id:6, white:'RookieRyan', black:'???', tc:'5+0', level:1, status:'waiting', moves:0, elo:'749 vs ???' },
]

export default function LobbyScreen() {
  const { openAuth, authed } = useApp()
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')
  const [lbLevel, setLbLevel] = useState(5)
  const [joinCode, setJoinCode] = useState('')
  const filtered = filter==='waiting' ? MOCK_ROOMS.filter(r=>r.status==='waiting') : MOCK_ROOMS
  const level = LEVELS.find(l=>l.id===lbLevel)
  const players = LEADERBOARD[lbLevel]||[]

  return (
    <div style={{padding:'24px 0 40px'}}>
      <div className="container">
        <div className="eyebrow" style={{marginTop:8}}>🌐 Online</div>
        <h1 className="section-heading orb">Game Lobby</h1>

        {/* Create / Join */}
        <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:24}}>
          <button className="btn btn-brand btn-md" onClick={() => authed?nav('/game'):openAuth('signup')}>
            + Create Room
          </button>
          <div style={{display:'flex',gap:8,flex:1,minWidth:200}}>
            <input className="form-input" style={{flex:1}} placeholder="ROOM CODE" maxLength={6}
              value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}/>
            <button className="btn btn-ghost btn-md" onClick={() => authed?nav('/game'):openAuth('signup')}>Join</button>
          </div>
        </div>

        {/* Filter */}
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {['all','waiting'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`btn btn-sm ${filter===f?'btn-brand':'btn-ghost'}`}>
              {f==='all'?'🎮 All Games':'⏳ Open Rooms'}
            </button>
          ))}
          <span style={{marginLeft:'auto',fontFamily:'var(--fm)',fontSize:'.72rem',color:'var(--text-3)',display:'flex',alignItems:'center'}}>
            {filtered.length} rooms live
          </span>
        </div>

        {/* Rooms */}
        <div className="rooms-grid" style={{marginBottom:40}}>
          {filtered.map(r=>{
            const lv = LEVELS.find(l=>l.id===r.level)
            return (
              <div key={r.id} className="room-card" onClick={()=>authed?nav('/game'):openAuth('signup')}>
                <div style={{fontSize:'1.5rem'}}>{r.status==='waiting'?'⏳':'♟'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontFamily:'var(--fr)',fontSize:'.95rem'}}>{r.white} vs {r.black}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.68rem',color:'var(--text-3)',marginTop:2}}>
                    ⏱ {r.tc} · {r.elo} {r.moves>0?'· Move '+r.moves:''}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                  <span style={{fontFamily:'var(--fm)',fontSize:'.65rem',color:lv?.color||'var(--brand)',fontWeight:700}}>
                    {lv?.icon} {lv?.name}
                  </span>
                  <span style={{fontFamily:'var(--fm)',fontSize:'.68rem',color:r.status==='waiting'?'var(--green)':'var(--cyan)',fontWeight:700}}>
                    {r.status==='waiting'?'● JOIN':'▶ LIVE'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Full leaderboard */}
        <div className="eyebrow" style={{marginBottom:12}}>📊 Full Rankings</div>
        <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
          {LEVELS.map(l=>(
            <button key={l.id}
              className={`btn btn-sm ${lbLevel===l.id?'btn-brand':'btn-ghost'}`}
              style={lbLevel===l.id?{background:l.color,color:l.level===5?'#000':'#fff'}:{}}
              onClick={()=>setLbLevel(l.id)}>
              {l.icon} {l.name}
            </button>
          ))}
        </div>
        <div className="lb-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th className="rank-cell">#</th><th>Player</th>
                <th className="tr">ELO</th><th className="tr lb-col-g">Games</th>
                <th className="tr lb-col-w">Wins</th><th className="tr">Win%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p,i)=>{
                const rank=i+1
                const med={1:'🥇',2:'🥈',3:'🥉'}
                const cls={1:'lb-row-g',2:'lb-row-s',3:'lb-row-b'}
                return (
                  <tr key={p.handle} className={`lb-row ${cls[rank]||''}`}>
                    <td className="rank-cell">{rank<=3?<span className="rank-medal">{med[rank]}</span>:<span className="rank-num">{rank}</span>}</td>
                    <td><div className="p-cell">
                      <div className="p-av" style={{background:`${p.hue}22`}}>{p.piece}</div>
                      <div><div className="p-handle">@{p.handle}</div><div className="p-flag">{p.country}</div></div>
                    </div></td>
                    <td className="tr"><span className="elo-val" style={{color:level?.color}}>{p.elo}</span></td>
                    <td className="tr lb-col-g" style={{fontFamily:'var(--fm)',fontSize:'.82rem'}}>{p.games.toLocaleString()}</td>
                    <td className="tr lb-col-w" style={{fontFamily:'var(--fm)',fontSize:'.82rem',color:'var(--green)'}}>{p.wins.toLocaleString()}</td>
                    <td className="tr"><span style={{fontFamily:'var(--fo)',fontWeight:700,fontSize:'.82rem'}}>{Math.round(p.wins/p.games*100)}%</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}