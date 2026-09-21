import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { AGENTS } from '../data/agents'

export default function AgentsScreen() {
  const { openAuth, authed } = useApp()
  const nav = useNavigate()
  const challenge = (a) => authed ? nav(`/game?agent=${a.id}`) : openAuth('signup')

  return (
    <div style={{padding:'24px 0 40px'}}>
      <div className="container">
        <div className="eyebrow" style={{marginTop:8}}>🤖 AI Roster</div>
        <h1 className="section-heading orb">AI Agents</h1>
        <p className="section-sub" style={{marginBottom:32}}>
          5 named agents that self-improve after every game. They track your openings,
          patch their own weaknesses, and evolve. Challenge your favourite.
        </p>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          {AGENTS.map((a,i) => (
            <div key={a.id} className="card reveal" style={{padding:'24px',border:`1.5px solid ${a.color}40`,borderRadius:16,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:a.color,opacity:.8}}/>
              <div style={{display:'flex',flexWrap:'wrap',gap:20,alignItems:'flex-start'}}>
                {/* Left */}
                <div style={{flex:'0 0 auto',textAlign:'center',minWidth:90}}>
                  <div style={{fontSize:'3.5rem',lineHeight:1,filter:`drop-shadow(0 0 16px ${a.color})`,marginBottom:8}}>{a.icon}</div>
                  <div className="orb" style={{fontSize:'1rem',fontWeight:900,color:a.color}}>{a.name}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.65rem',color:'var(--text-3)',marginTop:4}}>Level {a.level}</div>
                  <div className="orb" style={{fontSize:'1.2rem',fontWeight:900,color:a.color,marginTop:6}}>{a.elo}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.62rem',color:'var(--text-3)'}}>ELO</div>
                </div>
                {/* Mid */}
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.72rem',color:a.color,letterSpacing:'1px',textTransform:'uppercase',marginBottom:6}}>
                    {a.style}
                  </div>
                  <p style={{fontSize:'.9rem',color:'var(--text-2)',lineHeight:1.65,marginBottom:14}}>{a.desc}</p>
                  <div style={{display:'flex',gap:20,marginBottom:12}}>
                    {[{val:a.games.toLocaleString(),lbl:'Games'},{val:a.wins.toLocaleString(),lbl:'Wins'},{val:Math.round(a.wins/a.games*100)+'%',lbl:'Win%'},{val:a.losses.toLocaleString(),lbl:'Losses'}].map(s=>(
                      <div key={s.lbl} style={{textAlign:'center'}}>
                        <div className="orb" style={{fontSize:'.95rem',fontWeight:700,color:'var(--text)'}}>{s.val}</div>
                        <div style={{fontFamily:'var(--fm)',fontSize:'.6rem',color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.7rem',color:'var(--text-3)',marginBottom:4}}>⚙ {a.engine}</div>
                  <div style={{fontFamily:'var(--fm)',fontSize:'.7rem',color:a.color,display:'flex',alignItems:'center',gap:4}}>
                    <span>📈</span> Self-improving — trains after every game
                  </div>
                </div>
                {/* Right */}
                <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:140}}>
                  <button className="btn btn-brand btn-md btn-w" style={{fontFamily:'var(--fo)',background:a.color,color:a.level===5?'#000':'#fff'}}
                    onClick={() => challenge(a)}>
                    ⚔ Challenge
                  </button>
                  <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontFamily:'var(--fm)',fontSize:'.65rem',color:'var(--text-3)',marginBottom:4}}>STYLE PROFILE</div>
                    {[['Aggression',a.agent_memory.style_weights.aggression],
                      ['Positional',a.agent_memory.style_weights.positional]].map(([k,v])=>(
                      <div key={k} style={{marginBottom:6}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--fm)',fontSize:'.68rem',color:'var(--text-2)',marginBottom:2}}>
                          <span>{k}</span><span>{Math.round(v*100)}%</span>
                        </div>
                        <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${v*100}%`,background:a.color,borderRadius:2}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}