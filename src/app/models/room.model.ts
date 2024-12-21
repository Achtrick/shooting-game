export class Room {
  id: string;
  isFull: boolean;
  playerA: string;
  playerB: string;
  match: Match;
}

export class Match {
  rounds: number;
  scoreA: number;
  scoreB: number;
}
