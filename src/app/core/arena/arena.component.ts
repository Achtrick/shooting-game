import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Match, Room } from '../../models/room.model';
import { SocketService } from '../../services/socket.service';
import { PlayerComponent, PlayerType } from '../player/player.component';

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [CommonModule, PlayerComponent],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss',
})
export class ArenaComponent implements OnInit, OnDestroy {
  @ViewChild('playerA') playerA!: PlayerComponent;
  @ViewChild('playerB') playerB!: PlayerComponent;

  public loading: boolean = true;
  public opponentDisconnected: boolean = false;
  public loadingText: string = 'finding match ...';
  public room: Room = new Room();

  protected match: Match;
  protected round: number = 1;
  protected playerId: string;
  protected playerType: PlayerType;
  protected PlayerType = PlayerType;
  protected myPlayerHealth: number = 100;
  protected opponentPlayerHealth: number = 100;

  private myPlayer: PlayerComponent;
  private myPlayerPosition: DOMRect;
  private opponentPlayer: PlayerComponent;
  private opponentPlayerPosition: DOMRect;
  private isKeyHeld: boolean = false;
  private keyBeingHeld: string = '';
  private intervalId: any = null;
  private router: Router = new Router();

  constructor(private socketService: SocketService) {}

  public async ngOnInit(): Promise<void> {
    const id = crypto.randomUUID();
    const playerId = localStorage.getItem('PLAYER_ID');

    if (playerId) {
      this.playerId = playerId;
    } else {
      localStorage.setItem('PLAYER_ID', id);
      this.playerId = id;
    }

    await this.joinMatch();

    this.initializePlayer();

    this.socketService.on('MOVE', async (direction) => {
      if (!this.isKeyHeld) {
        this.opponentPlayer.keyHeld.next(direction);
      }
    });

    this.socketService.on('OPPONENT_DISCONNECTED', () => {
      this.opponentDisconnected = true;
      setTimeout(() => {
        this.router.navigateByUrl('/');
      }, 1000);
    });
  }

  private async joinMatch(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this.room = await this.socketService.joinMatch(
        localStorage.getItem('PLAYER_ID') ?? crypto.randomUUID()
      );

      this.match = this.room.match;

      this.playerType =
        this.room.id === this.playerId
          ? PlayerType.PLAYER_A
          : PlayerType.PLAYER_B;

      if (this.room.isFull) {
        this.loadingText = 'Match Found !';
        setTimeout(() => {
          this.loading = false;
          resolve();
        }, 1000);
      }
    });
  }

  private initializePlayer(): void {
    setTimeout(() => {
      this.myPlayer =
        this.playerType === PlayerType.PLAYER_A ? this.playerA : this.playerB;

      this.opponentPlayer =
        this.playerType === PlayerType.PLAYER_A ? this.playerB : this.playerA;

      this.myPlayer.BulletPosition.subscribe(({ bullet, position }) => {
        if (this.positionsIntersects(this.opponentPlayerPosition, position)) {
          this.opponentPlayerHealth -= 1;

          if (this.opponentPlayerHealth === 0) {
            if (this.myPlayer.type === PlayerType.PLAYER_A) {
              this.match.scoreA += 1;
              this.reset();
            } else {
              this.match.scoreB += 1;
              this.reset();
            }
          }
          bullet.remove();
        }
      });

      this.opponentPlayer.BulletPosition.subscribe(({ bullet, position }) => {
        if (this.positionsIntersects(this.myPlayerPosition, position)) {
          this.myPlayerHealth -= 1;

          if (this.myPlayerHealth === 0) {
            if (this.opponentPlayer.type === PlayerType.PLAYER_A) {
              this.match.scoreA += 1;
              this.reset();
            } else {
              this.match.scoreB += 1;
              this.reset();
            }
          }
          bullet.remove();
        }
      });

      this.opponentPlayer.PlayerPosition.subscribe((position: DOMRect) => {
        this.opponentPlayerPosition = position;
      });

      this.myPlayer.PlayerPosition.subscribe((position: DOMRect) => {
        this.myPlayerPosition = position;
      });

      addEventListener('keydown', this.onKeyDown);
      addEventListener('keyup', this.onKeyUp);
    }, 0);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isKeyHeld) {
      this.isKeyHeld = true;
      this.keyBeingHeld = event.key;
      this.intervalId = setInterval(() => {
        this.myPlayer.keyHeld.next(this.keyBeingHeld);
        this.socketService.emit(
          'MOVE',
          this.playerId + '|' + this.keyBeingHeld
        );
      }, 20);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (this.isKeyHeld && this.keyBeingHeld === event.key) {
      this.isKeyHeld = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  private positionsIntersects(p1: DOMRect, p2: DOMRect): boolean {
    return (
      p1?.left < p2?.right &&
      p1?.right > p2?.left &&
      p1?.top < p2?.bottom &&
      p1?.bottom > p2?.top
    );
  }

  private reset(): void {
    this.round++;
    this.myPlayerHealth = 100;
    this.opponentPlayerHealth = 100;
    this.myPlayer.initializePlayer();
    this.opponentPlayer.initializePlayer();

    if (this.round === this.match.rounds) {
      // Announce winner
    }
  }

  public ngOnDestroy(): void {
    this.socketService.emit('LEAVE_ROOM', this.playerId);
  }
}
