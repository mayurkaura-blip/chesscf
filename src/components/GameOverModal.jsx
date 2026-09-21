import { useNavigate } from 'react-router-dom'
export default function GameOverModal({ result, onPlayAgain }) {
  const nav = useNavigate()
  const { outcome, reason, eloDelta } = result
  const icon   = outcome==='win'?'🏆':outcome==='loss'?'💀':'🤝'
  const title  = outcome==='win'?'VICTORY':outcome==='loss'?'DEFEAT':'DRAW'
  const tcolor = outcome==='win'?'var(--green)':outcome==='loss'?'var(--pink)':'var(--gold)'
  const ecolor = eloDelta>0?'var(--green)':eloDelta<0?'var(--pink)':'var(--gold)'
  return (
    <div className="gameover-overlay">
      <div className="gameover-box">
        <div className="gameover-icon" style={{color:tcolor}}>{icon}</div>
        <div className="gameover-title" style={{color:tcolor}}>{title}</div>
        <div className="gameover-reason">{reason}</div>
        <div className="gameover-elo">
          <span className="gameover-elo-label">ELO change</span>
          <span className="gameover-elo-val" style={{color:ecolor}}>
            {eloDelta>0?`+${eloDelta}`:eloDelta}
          </span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn btn-brand btn-md btn-w" onClick={onPlayAgain}>▶ Play Again</button>
          <button className="btn btn-ghost btn-md btn-w" onClick={() => nav('/')}>← Back to Home</button>
        </div>
      </div>
    </div>
  )
}