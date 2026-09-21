import { Chess } from 'chess.js';

const PVAL = { p:100, n:320, b:330, r:500, q:900, k:20000 };
const PST = {
  p:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

function ev(chess) {
  if (chess.isCheckmate()) return chess.turn()==='w' ? -40000 : 40000;
  if (chess.isDraw()) return 0;
  const b = chess.board(); let s = 0;
  for (let r=0;r<8;r++) for (let f=0;f<8;f++) {
    const p=b[r][f]; if(!p) continue;
    const idx = p.color==='w' ? r*8+f : (7-r)*8+f;
    const v = PVAL[p.type] + (PST[p.type]?.[idx]||0);
    s += p.color==='w' ? v : -v;
  }
  return s;
}
function order(moves) {
  return [...moves].sort((a,b)=>{
    const sc = m=>(m.includes('x')?12:0)+(m.includes('+')?8:0)+(m.endsWith('=Q')?10:0);
    return sc(b)-sc(a);
  });
}
function mm(chess,d,a,b,max) {
  if(d===0||chess.isGameOver()) return ev(chess);
  const moves=order(chess.moves());
  if(max){ let best=-Infinity; for(const m of moves){chess.move(m);best=Math.max(best,mm(chess,d-1,a,b,false));chess.undo();a=Math.max(a,best);if(b<=a)break;} return best; }
  else { let best=Infinity; for(const m of moves){chess.move(m);best=Math.min(best,mm(chess,d-1,a,b,true));chess.undo();b=Math.min(b,best);if(b<=a)break;} return best; }
}

export function getBestMove(fen, depth=4, agentStyle=null) {
  const chess = new Chess(fen);
  const moves = chess.moves();
  if(!moves.length) return null;
  if(depth<=1 && Math.random()>.45) return moves[Math.floor(Math.random()*moves.length)];
  if(depth===2) {
    const caps = moves.filter(m=>m.includes('x'));
    if(caps.length && Math.random()>.5) return caps[Math.floor(Math.random()*caps.length)];
  }
  const shuffled = [...moves].sort(()=>Math.random()-.5);
  const isWhite = chess.turn()==='w';
  let best=null, bestScore=isWhite?-Infinity:Infinity;
  for(const m of shuffled) {
    chess.move(m);
    const score = mm(chess, Math.max(1,depth-1), -Infinity, Infinity, !isWhite);
    chess.undo();
    if(isWhite?score>bestScore:score<bestScore){bestScore=score;best=m;}
  }
  return best||moves[0];
}