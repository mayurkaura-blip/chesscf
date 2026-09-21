import { useState, useRef, useEffect } from 'react'

const AGENT_QUIPS = [
  "Interesting move... I recalculated. ⚡","My analysis gives you a slight disadvantage.",
  "Preparing my response...","That is a sharp line.",
  "You caught me off-guard there!","Processing 847 continuations...","Hmm. Unexpected.",
  "I have seen this pattern 12,441 times.","Your opening choice is noted for future reference.",
  "You play well for a human. 🎯",
]

export default function ChatDrawer({ onClose, agentName, level }) {
  const [msgs, setMsgs] = useState([
    { id:0, from: agentName, text:'Good luck! The battle begins. ⚔️', mine:false, sys:false },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const send = () => {
    if (!input.trim()) return
    const m = { id:Date.now(), from:'You', text:input, mine:true, sys:false }
    setMsgs(p => [...p, m])
    setInput('')
    setTimeout(() => {
      const reply = AGENT_QUIPS[Math.floor(Math.random()*AGENT_QUIPS.length)]
      setMsgs(p => [...p, { id:Date.now()+1, from:agentName, text:reply, mine:false, sys:false }])
    }, 600 + Math.random()*800)
  }

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div className="sheet-header">
          <span className="sheet-title">💬 Chat — {agentName}</span>
          <button className="btn-icon btn" onClick={onClose} aria-label="Close chat" style={{fontSize:'1rem'}}>✕</button>
        </div>
        <div className="chat-msgs scroll-area">
          {msgs.map(m => (
            <div key={m.id} className={`chat-msg${m.mine?' mine':''}`}>
              {!m.mine && <span className="chat-from">{m.from}</span>}
              <div className={`chat-bubble ${m.sys?'chat-bubble-sys':m.mine?'chat-bubble-out':'chat-bubble-in'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-input-row">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && send()}
            className="form-input" placeholder="Message..." style={{flex:1}}/>
          <button className="btn btn-brand btn-sm" onClick={send} style={{flexShrink:0}}>Send</button>
        </div>
      </div>
    </div>
  )
}