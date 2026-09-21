import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useApp } from '../App'
import { AGENTS } from '../data/agents'
import { LEVELS } from '../data/levels'
import { getBestMove } from '../utils/chessAI'
import ChatDrawer from '../components/ChatDrawer'
import VoiceBar from '../components/VoiceBar'
import GameOverModal from '../components/GameOverModal'

const SYM = { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' }
function fmt(ms) { const s=Math.max(0,Math.floor(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }

export default function GameScreen() {
  const { profile, updateProfile, openAuth, authed } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()

  // Config
  const agentId = params.get('agent') || 'pawn-e'
  const levelId = parseInt(params.get('level') || '1')
  const agent = AGENTS.find(a => a.id===agentId) || AGENTS.find(a=>a.level===levelId) || AGENTS[0]
  const level = LEVELS.find(l=>l.id===agent.level) || LEVELS[0]
  const playerColor = 'white'
  const timeControl = 600
  const playerTurn = 'w'
  const aiTurn = 'b'

  // Board size responsive
  const [boardSize, setBoardSize] = useState(() =>
    Math.min(window.innerWidth - 20, Math.floor((window.innerHeight - 240) * 0.95))
  )
  useEffect(() => {
    const fn = () => setBoardSize(Math.min(window.innerWidth-20, Math.floor((window.innerHeight-240)*.95)))
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Game state
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState([])
  const [aiThinking, setAiThinking] = useState(false)
  const [gameOver, setGameOver] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const doneRef = useRef(false)
  const clockRef = useRef(null)
  const [clocks, setClocks] = useState({ w: timeControl*1000, b: timeControl*1000 })

  // Captured pieces
  const captured = { w:[], b:[] }
  history.forEach(m => { if (m.captured) captured[m.color].push(m.captured) })
  const myCapt  = captured.b  // pieces I took
  const oppCapt = captured.w  // pieces agent took

  const endGame = useCallback((outcome, reason) => {
    if (doneRef.current) return
    doneRef.current = true
    clearInterval(clockRef.current)
    const delta = outcome==='win'?15:outcome==='loss'?-15:3
    updateProfile({
      wins:   profile.wins   + (outcome==='win' ?1:0),
      losses: profile.losses + (outcome==='loss'?1:0),
      draws:  profile.draws  + (outcome==='draw'?1:0),
      elo: Math.max(100, profile.elo + delta),
    })
    setGameOver({ outcome, reason, eloDelta: delta })
  }, [profile, updateProfile])

  const checkEnd = useCallback(() => {
    const c = chessRef.current
    if (c.isCheckmate()) { endGame(c.turn()!==playerTurn?'win':'loss','Checkmate'); return true }
    if (c.isStalemate()) { endGame('draw','Stalemate'); return true }
    if (c.isDraw())      { endGame('draw',c.isThreefoldRepetition()?'Threefold Repetition':'Insufficient Material'); return true }
    return false
  }, [playerTurn, endGame])

  // Clock
  useEffect(() => {
    if (gameOver || timeControl>=99999) return
    clockRef.current = setInterval(() => {
      const t = chessRef.current.turn()
      setClocks(p => {
        const nv = p[t] - 100
        if (nv <= 0) { endGame(t===playerTurn?'loss':'win','Timeout'); return { ...p, [t]:0 } }
        return { ...p, [t]:nv }
      })
    }, 100)
    return () => clearInterval(clockRef.current)
  }, [gameOver, timeControl, playerTurn, endGame])

  // Player move
  const onDrop = (from, to) => {
    if (gameOver || aiThinking || chessRef.current.turn()!==playerTurn) return false
    const move = chessRef.current.move({ from, to, promotion:'q' })
    if (!move) return false
    setFen(chessRef.current.fen())
    setHistory(chessRef.current.history({ verbose:true }))
    checkEnd()
    return true
  }

  // AI move
  const doAI = useCallback(async () => {
    if (doneRef.current || chessRef.current.isGameOver()) return
    setAiThinking(true)
    const delay = 300 + Math.random()*600
    await new Promise(r => setTimeout(r, delay))
    const move = getBestMove(chessRef.current.fen(), level.depth, agent.agent_memory?.style_weights)
    if (move && !doneRef.current) {
      chessRef.current.move(move)
      setFen(chessRef.current.fen())
      setHistory(chessRef.current.history({ verbose:true }))
      checkEnd()
    }
    setAiThinking(false)
  }, [level.depth, agent, checkEnd])

  useEffect(() => {
    if (!gameOver && chessRef.current.turn()===aiTurn && !aiThinking) doAI()
  }, [fen, gameOver, aiTurn, aiThinking, doAI])

  const isMyTurn = !gameOver && !aiThinking && chessRef.current.turn()===playerTurn
  const inCheck  = chessRef.current.isCheck()

  const resetGame = () => {
    doneRef.current = false
    chessRef.current = new Chess()
    setFen(chessRef.current.fen())
    setHistory([])
    setClocks({ w:timeControl*1000, b:timeControl*1000 })
    setGameOver(null)
    setAiThinking(false)
  }

  return (
    <div className="game-root">
      {/* Agent (opponent) bar */}
      <div className="game-opp-bar" role="region" aria-label="Opponent">
        <div className="player-info">
          <div className={`player-av${!isMyTurn&&!gameOver?' active':''}`}
            style={{background:`linear-gradient(135deg,${agent.color}30,${agent.color}10)`,'--brand':agent.color}}
            aria-hidden="true">
            {agent.icon}
          </div>
          <div>
            <div className="player-name orb" style={{color:agent.color}}>{agent.name}</div>
            <div className={`player-meta${aiThinking?' thinking':''}`}>
              {aiThinking ? '⟳ Calculating...' : `ELO ${agent.elo} · Level ${agent.level}`}
            </div>
          </div>
        </div>
        <div className={`chess-clock${!isMyTurn&&!gameOver?' my-turn':''}${clocks.b<30000?' danger':''}`}
          aria-label={`Opponent clock: ${fmt(clocks.b)}`}>
          {fmt(clocks.b)}
        </div>
      </div>

      {/* Opponent captured */}
      <div className="captured-row" aria-hidden="true">
        {oppCapt.map((t,i) => <span key={i}>{SYM[('b'+t.toUpperCase())]||''}</span>)}
      </div>

      {/* Board */}
      <div className="board-area" role="main" aria-label="Chess board">
        <Chessboard
          id="chesscf-board"
          position={fen}
          onPieceDrop={onDrop}
          boardWidth={Math.min(boardSize, 520)}
          boardOrientation={playerColor}
          arePiecesDraggable={isMyTurn}
          customBoardStyle={{ borderRadius:'8px', boxShadow:'0 12px 48px rgba(0,0,0,.8), 0 0 30px rgba(255,106,0,.08)' }}
          customDarkSquareStyle={{ backgroundColor:'#1A1A2E' }}
          customLightSquareStyle={{ backgroundColor:'#2A2A4E' }}
          customDropSquareStyle={{ boxShadow:'inset 0 0 1px 4px var(--brand)' }}
        />
        {/* Overlays */}
        <div className="board-overlay">
          {aiThinking && (
            <div className="board-badge board-badge-think" role="status" aria-live="polite">
              🤖 {agent.name} is thinking...
            </div>
          )}
          {inCheck && !gameOver && (
            <div className="board-badge board-badge-check" role="alert">
              ♔ CHECK!
            </div>
          )}
        </div>
        {showVoice && <VoiceBar onClose={() => setShowVoice(false)}/>}
      </div>

      {/* Player captured */}
      <div className="captured-row" aria-hidden="true">
        {myCapt.map((t,i) => <span key={i}>{SYM[('w'+t.toUpperCase())]||''}</span>)}
      </div>

      {/* Player bar */}
      <div className="game-player-bar" role="region" aria-label="Your info">
        <div className="player-info">
          <div className={`player-av${isMyTurn?' active':''}`} aria-hidden="true"
            style={{background:'linear-gradient(135deg,rgba(255,106,0,.3),rgba(255,106,0,.1))'}}>
            ♟
          </div>
          <div>
            <div className="player-name orb">@{profile.handle}</div>
            <div className="player-meta">
              ELO {profile.elo} {isMyTurn ? '· <span style="color:var(--green)">Your turn</span>' : '· Waiting...'}
            </div>
          </div>
        </div>
        <div className={`chess-clock${isMyTurn?' my-turn':''}${clocks.w<30000?' danger':''}`}
          aria-label={`Your clock: ${fmt(clocks.w)}`}>
          {fmt(clocks.w)}
        </div>
      </div>

      {/* Action bar */}
      <div className="game-action-bar" role="toolbar" aria-label="Game controls">
        <button className="btn btn-icon" onClick={() => nav('/')} title="Home" aria-label="Back to home">←</button>
        <button className="btn btn-icon" onClick={() => setShowChat(true)} title="Chat" aria-label="Open chat">💬</button>
        <button className="btn btn-icon"
          onClick={() => setShowVoice(v=>!v)} title="Voice" aria-label="Toggle voice"
          style={{color:showVoice?'var(--cyan)':'var(--text-2)',borderColor:showVoice?'var(--cyan)':'var(--border)'}}>
          🎤
        </button>
        <button className="btn btn-outline btn-sm" style={{flex:1}}
          onClick={() => endGame('loss','Resigned')}>🏳 Resign</button>
        <button className="btn btn-surface btn-sm" style={{flex:1}}
          onClick={() => endGame('draw','Draw Agreed')}>🤝 Draw</button>
      </div>

      {showChat && <ChatDrawer onClose={() => setShowChat(false)} agentName={agent.name} level={agent.level}/>}
      {gameOver && <GameOverModal result={gameOver} onPlayAgain={resetGame}/>}
    </div>
  )
}