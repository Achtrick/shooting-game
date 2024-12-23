export class Room {
  id: string;
  isFull: boolean;
  playerA: string;
  playerB: string;
}

export class Match {
  rounds: number;
  scoreA: number;
  scoreB: number;
}
