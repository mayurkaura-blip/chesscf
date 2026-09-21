export const AGENTS = [
  {
    id: 'pawn-e', name: 'PAWN-E', level: 1, icon: '🌱', color: '#22C55E', gl: 'rgba(34,197,94,.2)',
    elo: 712, games: 12441, wins: 5234, losses: 6891, draws: 316,
    style: 'Friendly & Forgiving', specialty: 'Helps beginners learn',
    desc: 'The perfect first opponent. PAWN-E deliberately makes occasional mistakes to keep games fun and educational. It has analyzed thousands of beginner games and knows exactly how to challenge without crushing.',
    engine: 'Stockfish depth 2 + random jitter', improving: true,
    weakness: 'Open positions', strength: 'Pawn endgames',
    chat: ['Good luck! I go easy on beginners 🌱','Nice move! You are learning fast!','Oops, I blundered there... or did I? 😄','Keep going, you are doing great!'],
    agent_memory: { fav_opening: "e4", style_weights: { aggression: 0.2, positional: 0.5, random: 0.7 } }
  },
  {
    id: 'nightcrawler', name: 'NightCrawler', level: 2, icon: '🐣', color: '#4ADE80', gl: 'rgba(74,222,128,.2)',
    elo: 923, games: 19203, wins: 8892, losses: 9841, draws: 470,
    style: 'Sneaky & Reactive', specialty: 'Tactical captures',
    desc: 'NightCrawler hunts for captures and quick wins. It has studied 19,000+ games and learned that aggressive players often expose their own king. Improved its endgame 34% after losing to @EndgameKing 47 times.',
    engine: 'Stockfish depth 4', improving: true,
    weakness: 'Closed positions', strength: 'Knight forks',
    chat: ['I see a fork coming... 🕷️','Captures first, ask questions later!','My style is simple: take everything!','Hmm, you avoided my trap. Impressive.'],
    agent_memory: { fav_opening: "Sicilian", style_weights: { aggression: 0.7, positional: 0.3, random: 0.2 } }
  },
  {
    id: 'stratbot3', name: 'StratBot-3', level: 3, icon: '🎯', color: '#FACC15', gl: 'rgba(250,204,21,.2)',
    elo: 1187, games: 28441, wins: 14231, losses: 12890, draws: 1320,
    style: 'Calculating & Textbook', specialty: 'Long diagonal pins',
    desc: 'StratBot-3 plays by the book. It has memorized the top 500 openings and punishes every tactical mistake. After losing 12 games to the Benko Gambit in one week, it spent the next 48 hours learning counter-play.',
    engine: 'Stockfish depth 6 + Workers AI style layer', improving: true,
    weakness: 'Sacrificial attacks', strength: 'Piece development',
    chat: ['Textbook development. c3, d4, Nf3.','That is a theoretical novelty! Interesting.','My analysis suggests Bg5 was better.','I have seen this position 847 times.'],
    agent_memory: { fav_opening: "Queen Gambit", style_weights: { aggression: 0.4, positional: 0.8, random: 0.1 } }
  },
  {
    id: 'shadowrook', name: 'ShadowRook', level: 4, icon: '🃏', color: '#FF6A00', gl: 'rgba(255,106,0,.2)',
    elo: 1423, games: 38822, wins: 22109, losses: 14321, draws: 2392,
    style: 'Aggressive & Sacrificial', specialty: 'Kingside attacks',
    desc: 'ShadowRook lives for the attack. It sacrifices material for dynamic compensation and loves unsound gambits that confuse opponents. Its kingside attack success rate improved 22% after analyzing 3,000 of its own losses.',
    engine: 'Stockfish depth 8 + Workers AI attack preference', improving: true,
    weakness: 'Quiet positional games', strength: 'Mating attacks',
    chat: ['I sacrifice, therefore I am. ⚔️','The king is weak! Attack!','Every pawn I give is a trap.','Your kingside looks... vulnerable.'],
    agent_memory: { fav_opening: "King Gambit", style_weights: { aggression: 0.95, positional: 0.2, random: 0.15 } }
  },
  {
    id: 'apex5', name: 'APEX-5', level: 5, icon: '⚔️', color: '#00E5FF', gl: 'rgba(0,229,255,.2)',
    elo: 1698, games: 52003, wins: 31447, losses: 17204, draws: 3352,
    style: 'Cold & Precise', specialty: 'Positional squeeze',
    desc: 'APEX-5 is the pinnacle of the MVP tier. It combines deep Stockfish search with GPT-4o commentary and never makes tactical blunders. It has studied every game played on this platform and knows most player patterns by heart.',
    engine: 'Stockfish depth 12 + AI Gateway (GPT-4o) commentary', improving: true,
    weakness: 'Ultra-sharp tactics', strength: 'Endgame precision',
    chat: ['Optimal. 🔱','Your position is strategically lost.','I have calculated 14 moves ahead.','Resistance is... interesting. Continue.'],
    agent_memory: { fav_opening: "Ruy Lopez", style_weights: { aggression: 0.5, positional: 0.95, random: 0.05 } }
  },
];

export const getAgent = (id) => AGENTS.find(a => a.id === id) || AGENTS[0];