export const LEVELS = [
  { id:1, name:'Beginner',    icon:'🌱', color:'#22C55E', elo:'< 800',    desc:'First-time players',       agent:'PAWN-E',       depth:2 },
  { id:2, name:'Novice',      icon:'🐣', color:'#4ADE80', elo:'800–1000', desc:'Building fundamentals',    agent:'NightCrawler', depth:4 },
  { id:3, name:'Apprentice',  icon:'🎯', color:'#FACC15', elo:'1000–1250',desc:'Developing strategy',      agent:'StratBot-3',   depth:6 },
  { id:4, name:'Casual',      icon:'🃏', color:'#FF6A00', elo:'1250–1500',desc:'Regular club player',      agent:'ShadowRook',   depth:8 },
  { id:5, name:'Intermediate',icon:'⚔️', color:'#00E5FF', elo:'1500–1750',desc:'Solid tactical awareness', agent:'APEX-5',       depth:12},
];

// Phase 2 levels (locked)
export const LEVELS_P2 = [
  { id:6, name:'Skilled',  icon:'🔥', color:'#EF4444', locked:true },
  { id:7, name:'Advanced', icon:'⚡', color:'#A78BFA', locked:true },
  { id:8, name:'Elite',    icon:'💎', color:'#818CF8', locked:true },
  { id:9, name:'Master',   icon:'👑', color:'#7C3AED', locked:true },
  { id:10,name:'Expert',   icon:'🌟', color:'#FFD700', locked:true },
];