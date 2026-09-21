import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'

const HIST = [
  {opp:'APEX-5',result:'loss',elo:'-15',tc:'10+0',date:'Today'},
  {opp:'ShadowRook',result:'win',elo:'+15',tc:'5+3',date:'Today'},
  {opp:'NightCrawler',result:'win',elo:'+15',tc:'3+0',date:'Yesterday'},
  {opp:'StratBot-3',result:'draw',elo:'+3',tc:'15+10',date:'Yesterday'},
  {opp:'PAWN-E',result:'win',elo:'+15',tc:'1+0',date:'2 days ago'},
]
const ACHI = [
  {icon:'🏆',label:'First Win',done:true},{icon:'🔥',label:'5 Win Streak',done:false},
  {icon:'🧠',label:'Beat Level 5',done:false},{icon:'⚡',label:'Win <20 Moves',done:false},
  {icon:'♟',label:'Play 10 Games',done:true},{icon:'👑',label:'1400+ ELO',done:false},
]
const rColor = r=>r==='win'?'var(--green)':r==='loss'?'var(--pink)':'var(--gold)'
const rLabel = r=>r==='win'?'✓ Win':r==='loss'?'✗ Loss':'= Draw'

export default function ProfileScreen() {
  const { profile, updateProfile, logout } = useApp()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile.handle)

  const total = profile.wins + profile.losses + profile.draws
  const winPct = total>0 ? Math.round((profile.wins/total)*100) : 0
  const save = () => { if(name.trim()&&name.length>=3) { updateProfile({handle:name.trim()}); setEditing(false) } }

  return (
    <div style={{paddingBottom:40}}>
      {/* Header */}
      <div className="prof-header">
        <div className="prof-av" aria-hidden="true">♟</div>
        {editing ? (
          <div style={{display:'flex',gap:8,marginBottom:6}}>
            <input className="form-input" style={{width:160,textAlign:'center',fontFamily:'var(--fo)',fontWeight:700}}
              value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} autoFocus/>
            <button className="btn btn-brand btn-sm" onClick={save}>Save</button>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <span className="orb" style={{fontSize:'1.4rem',fontWeight:900}}>@{profile.handle}</span>
            <button className="btn btn-icon" style={{width:28,height:28,fontSize:'.8rem'}} onClick={()=>setEditing(true)} aria-label="Edit handle">✏️</button>
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center'}}>
          <span className="badge badge-brand" style={{fontSize:'1rem',padding:'4px 14px'}}>
            ⭐ {profile.elo} ELO
          </span>
          <span className="badge badge-green">● Online</span>
        </div>
      </div>

      <div className="container">
        {/* Stats grid */}
        <div className="prof-stats">
          {[
            {val:total,lbl:'Played',color:'var(--text)'},
            {val:profile.wins,lbl:'Wins',color:'var(--green)'},
            {val:profile.losses,lbl:'Losses',color:'var(--pink)'},
            {val:profile.draws,lbl:'Draws',color:'var(--gold)'},
          ].map(s=>(
            <div key={s.lbl} className="prof-stat">
              <div className="prof-stat-val" style={{color:s.color}}>{s.val}</div>
              <div className="prof-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Win rate */}
        <div className="card" style={{padding:'16px',marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontFamily:'var(--fr)',fontWeight:600}}>
            <span>Win Rate</span>
            <span className="orb" style={{color:'var(--brand)'}}>{winPct}%</span>
          </div>
          <div style={{height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${winPct}%`,background:'linear-gradient(90deg,var(--brand),var(--green))',borderRadius:3,transition:'width .5s ease'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontFamily:'var(--fm)',fontSize:'.68rem',color:'var(--text-3)'}}>
            <span>{profile.wins} W</span><span>{profile.draws} D</span><span>{profile.losses} L</span>
          </div>
        </div>

        {/* Achievements */}
        <h2 className="orb" style={{fontSize:'1rem',marginBottom:12}}>Achievements</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24}}>
          {ACHI.map(a=>(
            <div key={a.label} className="card" style={{textAlign:'center',padding:'14px 8px',opacity:a.done?1:.35}}>
              <div style={{fontSize:'1.5rem',marginBottom:4}}>{a.icon}</div>
              <div style={{fontFamily:'var(--fm)',fontSize:'.65rem',fontWeight:600,color:a.done?'var(--text)':'var(--text-3)'}}>{a.label}</div>
            </div>
          ))}
        </div>

        {/* Game history */}
        <h2 className="orb" style={{fontSize:'1rem',marginBottom:12}}>Recent Games</h2>
        <div style={{marginBottom:24}}>
          {HIST.map((h,i)=>(
            <div key={i} className="hist-row card">
              <div style={{fontSize:'1.3rem'}}>{h.result==='win'?'🏆':h.result==='loss'?'💀':'🤝'}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>vs {h.opp}</div>
                <div style={{fontFamily:'var(--fm)',fontSize:'.68rem',color:'var(--text-3)'}}>⏱ {h.tc} · {h.date}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--fo)',fontWeight:800,fontSize:'.9rem',color:rColor(h.result)}}>{rLabel(h.result)}</div>
                <div style={{fontFamily:'var(--fo)',fontWeight:700,fontSize:'.85rem',color:h.elo.startsWith('+')?'var(--green)':h.elo==='+3'?'var(--gold)':'var(--pink)'}}>{h.elo}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <h2 className="orb" style={{fontSize:'1rem',marginBottom:12}}>Settings</h2>
        <div className="card" style={{padding:'0 16px',marginBottom:24}}>
          {[['🎨 Board Theme','Neon Dark'],['♟ Piece Set','Classic'],['🔔 Push Notifications','On'],['🎵 Sound Effects','On'],['⚡ CF Region','Auto (nearest)']].map(([l,v],i,arr)=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none'}}>
              <span style={{fontSize:'.9rem'}}>{l}</span>
              <span style={{fontFamily:'var(--fm)',fontSize:'.75rem',color:'var(--brand)',fontWeight:700}}>{v} ›</span>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-md btn-w" onClick={logout} style={{color:'var(--pink)',borderColor:'rgba(255,45,126,.3)'}}>
          Log Out
        </button>
      </div>
    </div>
  )
}