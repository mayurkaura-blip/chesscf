import { useState } from 'react'
export default function VoiceBar({ onClose }) {
  const [muted, setMuted] = useState(false)
  const [ptt, setPtt] = useState(false)
  return (
    <div className="voice-bar">
      <span style={{fontSize:'1.2rem'}}>🎤</span>
      <div style={{flex:1}}>
        <div className="voice-badge">
          <span className="voice-dot"/>
          Cloudflare Calls · Voice Active
        </div>
        <div style={{fontFamily:'var(--fm)',fontSize:'.65rem',color:'var(--text-3)',marginTop:2}}>
          WebRTC TURN · P2P
        </div>
      </div>
      <button className="btn btn-icon" aria-label={muted?'Unmute':'Mute'}
        style={{background:muted?'var(--pink)':'var(--card)',color:muted?'#fff':'var(--text-2)',fontSize:'1rem'}}
        onClick={() => setMuted(v=>!v)}>
        {muted?'🔇':'🎤'}
      </button>
      <button className="btn btn-icon" aria-label="Push to talk"
        style={{background:ptt?'var(--cyan)':'var(--card)',color:ptt?'#000':'var(--text-2)',fontSize:'1rem',
          boxShadow:ptt?'var(--glow-c)':undefined}}
        onMouseDown={() => setPtt(true)} onMouseUp={() => setPtt(false)}
        onTouchStart={() => setPtt(true)} onTouchEnd={() => setPtt(false)}>
        🔊
      </button>
      <button className="btn btn-icon" onClick={onClose} aria-label="Close voice" style={{fontSize:'.9rem'}}>✕</button>
    </div>
  )
}