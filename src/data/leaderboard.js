const FLAGS = ['🇨🇦','🇺🇸','🇬🇧','🇩🇪','🇫🇷','🇧🇷','🇮🇳','🇯🇵','🇰🇷','🇦🇺','🇷🇺','🇨🇳','🇳🇱','🇸🇪','🇵🇱'];
const PIECES = ['♔','♕','♖','♗','♘','♙','♚','♛','♜','♝','♞','♟'];
const COLORS = ['#FF6A00','#9B59F5','#00FF88','#00E5FF','#FF2D7E','#FFD700','#4ADE80','#FACC15','#FB923C','#818CF8','#F472B6','#34D399'];

function mk(handle,elo,games,wins,streak,fi,pi,ci) {
  return { handle, elo, games, wins, losses:games-wins-Math.floor(games*.08), draws:Math.floor(games*.08), streak, country:FLAGS[fi%15], piece:PIECES[pi%12], hue:COLORS[ci%12] };
}

export const LEADERBOARD = {
  1: [
    mk('PawnPusher',791,312,187,4,0,0,0),mk('Chessy_Cat',778,201,115,2,1,1,1),mk('JustLearning',762,428,240,5,2,2,2),
    mk('RookieRyan',749,187,102,1,3,3,3),mk('KingNewbie',733,267,142,3,4,4,4),mk('LearnerX1',716,534,272,6,5,5,5),
    mk('ChessStart',698,143,69,1,6,6,6),mk('LittlePawn',681,221,103,2,7,7,7),mk('GrowingUp',663,178,79,3,8,8,8),
    mk('QuietBishop',644,356,153,1,9,9,9),mk('SillyKnight',621,98,39,0,10,10,10),mk('Beginn3r',597,612,239,4,11,11,11),
    mk('ClubNewbie',571,76,27,1,12,12,12),mk('FirstMoves',541,154,51,0,13,0,1),mk('CheckMate_0',512,112,34,2,14,1,2),
  ],
  2: [
    mk('NoviceNate',947,521,322,5,0,0,2),mk('PawnAdvance',934,389,233,3,1,1,3),mk('OpeningFan',921,612,358,7,2,2,4),
    mk('RookieLevel2',908,287,163,2,3,3,5),mk('ChessStudent',893,445,247,4,4,4,6),mk('BasicTactic',879,334,180,3,5,5,7),
    mk('PawnBroker',863,523,274,2,6,6,8),mk('RiseFromPawn',847,411,209,5,7,7,9),mk('KnightJumper',831,298,147,1,8,8,10),
    mk('SlowOpening',817,567,272,3,9,9,11),mk('TryingHard99',803,423,197,2,10,10,0),mk('CasualPawn',820,312,143,1,11,11,1),
    mk('SmallGains',819,489,220,4,12,0,2),mk('MiddleGame0',815,234,103,0,13,1,3),mk('Novic3',808,367,158,2,14,2,4),
  ],
  3: [
    mk('ApprenticeX',1098,734,484,8,0,0,4),mk('ForkSpecialist',1084,612,392,6,1,1,5),mk('PinMaster3',1071,823,514,5,2,2,6),
    mk('TacticalApr',1057,567,340,4,3,3,7),mk('SmartPawn99',1042,689,400,7,4,4,8),mk('PieceActivity',1029,512,287,3,5,5,9),
    mk('CenterControl',1014,745,402,5,6,6,10),mk('DevPieces',1001,634,330,4,7,7,11),mk('OpenFileRook',988,456,228,2,8,8,0),
    mk('KnightOutpost',975,589,283,6,9,9,1),mk('BishopDiag',962,423,196,3,10,10,2),mk('SemiTactical',951,678,305,2,11,11,3),
    mk('ChessGrowing',967,534,235,4,12,0,4),mk('RookLift',957,401,172,1,13,1,5),mk('ApprenticeApp',961,512,215,3,14,2,6),
  ],
  4: [
    mk('WeekendPlayer',1247,1023,706,9,0,0,6),mk('CasualChess',1233,867,580,7,1,1,7),mk('PubGaming',1219,1145,743,6,2,2,8),
    mk('SaturdayKing',1204,789,496,5,3,3,9),mk('ClubMember_4',1189,934,570,8,4,4,10),mk('CoffeeHouse',1175,1067,630,4,5,5,11),
    mk('ChessPub',1161,823,470,6,6,6,0),mk('CasualFighter',1148,712,392,3,7,7,1),mk('EzPzChess',1134,956,507,5,8,8,2),
    mk('SundayChess',1121,1234,636,4,9,9,3),mk('MidnightGame',1108,678,332,2,10,10,4),mk('CasualKing',1125,845,404,7,11,11,5),
    mk('FunPlayer99',1112,934,439,3,12,0,6),mk('ChessBreak',1108,567,260,1,13,1,7),mk('LunchBreaker',1105,712,320,2,14,2,8),
  ],
  5: [
    mk('TacticsKing',1748,1456,1049,12,0,0,8),mk('CalcBetter5',1731,1234,864,9,1,1,9),mk('OpeningBook5',1714,1578,1072,11,2,2,10),
    mk('MiddleGame5',1697,1123,741,8,3,3,11),mk('ChessThink',1680,1345,862,10,4,4,0),mk('ManeuverKng',1663,1089,675,7,5,5,1),
    mk('SolidPlayer',1646,1456,875,9,6,6,2),mk('GoodTactics',1629,1234,716,6,7,7,3),mk('AnticipateX',1613,1123,629,8,8,8,4),
    mk('PlanMaker',1597,1567,861,5,9,9,5),mk('RookBehind',1580,978,518,7,10,10,6),mk('ProtectedPass',1567,1345,699,6,11,11,7),
    mk('IntermedFan',1554,1089,558,4,12,0,8),mk('Level5Pro',1538,1234,617,5,13,1,9),mk('HalfMaster5',1522,1012,496,3,14,2,10),
  ],
};