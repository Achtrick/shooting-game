import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
  public loadingText: string;
  public room: Room = new Room();

  protected matchId: string;
  protected friendlyMatch: boolean = false;
  protected match: Match;
  protected round: number = 1;
  protected playerId: string;
  protected playerType: PlayerType;
  protected PlayerType = PlayerType;
  protected myPlayerHealth: number = 100;
  protected opponentPlayerHealth: number = 100;
  protected roundWon: string = '';
  protected matchWon: string = '';

  private myPlayer: PlayerComponent;
  private myPlayerPosition: DOMRect;
  private opponentPlayer: PlayerComponent;
  private opponentPlayerPosition: DOMRect;
  private keyBeingHeld: string = '';
  private movingIntervalId: any = null;
  private shootingIntervalId: any = null;
  private router: Router = new Router();
  private destroy: Subject<void> = new Subject();

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  public async ngOnInit(): Promise<void> {
    this.route.params.subscribe((params: Params) => {
      this.matchId = params['id'];
      if (this.matchId === 'friendly') {
        this.friendlyMatch = true;
        this.matchId = '';
      }
    });

    const id = Math.random().toString(36).substr(2, 9);
    const playerId = localStorage.getItem('PLAYER_ID');

    if (playerId) {
      this.playerId = playerId;
    } else {
      localStorage.setItem('PLAYER_ID', id);
      this.playerId = id;
    }

    this.loadingText = this.friendlyMatch
      ? 'send this code to your freind: ' + this.playerId
      : 'finding match ...';

    await this.joinMatch();

    this.initializePlayer();

    this.socketService.on('KEY_HELD', async ({ playerId, direction }) => {
      if (this.playerId === playerId) {
        this.myPlayer.keyHeld.next(direction);
      } else {
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
        localStorage.getItem('PLAYER_ID') ??
          Math.random().toString(36).substr(2, 9),
        this.matchId,
        this.friendlyMatch
      );

      this.match = {
        scoreA: 0,
        scoreB: 0,
        rounds: 6,
      };

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
      this.myPlayerPosition =
        this.myPlayer.ragdoll.nativeElement.getBoundingClientRect();

      this.opponentPlayer =
        this.playerType === PlayerType.PLAYER_A ? this.playerB : this.playerA;
      this.opponentPlayerPosition =
        this.myPlayer.ragdoll.nativeElement.getBoundingClientRect();

      this.myPlayer.BulletPosition.pipe(takeUntil(this.destroy)).subscribe(
        ({ bullet, position }) => {
          if (this.positionsIntersects(this.opponentPlayerPosition, position)) {
            this.opponentPlayerHealth -= 1;

            if (this.opponentPlayerHealth === 0) {
              if (this.myPlayer.type === PlayerType.PLAYER_A) {
                this.match.scoreA += 1;
                this.reset(this.myPlayer);
              } else {
                this.match.scoreB += 1;
                this.reset(this.myPlayer);
              }
            }
            bullet.remove();
          }
        }
      );

      this.opponentPlayer.BulletPosition.pipe(
        takeUntil(this.destroy)
      ).subscribe(({ bullet, position }) => {
        if (this.positionsIntersects(this.myPlayerPosition, position)) {
          this.myPlayerHealth -= 1;

          if (this.myPlayerHealth === 0) {
            if (this.opponentPlayer.type === PlayerType.PLAYER_A) {
              this.match.scoreA += 1;
              this.reset(this.opponentPlayer);
            } else {
              this.match.scoreB += 1;
              this.reset(this.opponentPlayer);
            }
          }
          bullet.remove();
        }
      });

      this.opponentPlayer.PlayerPosition.pipe(
        takeUntil(this.destroy)
      ).subscribe((position: DOMRect) => {
        this.opponentPlayerPosition = position;
      });

      this.myPlayer.PlayerPosition.pipe(takeUntil(this.destroy)).subscribe(
        (position: DOMRect) => {
          this.myPlayerPosition = position;
        }
      );

      addEventListener('keydown', this.onKeyDown);
      addEventListener('keyup', this.onKeyUp);
    }, 0);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === ' ') {
      clearInterval(this.shootingIntervalId);
      this.shootingIntervalId = null;
      this.shootingIntervalId = setInterval(() => {
        this.socketService.emit('KEY_HELD', this.playerId + '|' + event.key);
      }, 20);
    } else {
      clearInterval(this.movingIntervalId);
      this.movingIntervalId = null;
      this.keyBeingHeld = event.key;
      this.movingIntervalId = setInterval(() => {
        this.socketService.emit(
          'KEY_HELD',
          this.playerId + '|' + this.keyBeingHeld
        );
      }, 20);
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (this.keyBeingHeld === event.key) {
      clearInterval(this.movingIntervalId);
      this.movingIntervalId = null;
    }
    if (event.key === ' ') {
      clearInterval(this.shootingIntervalId);
      this.shootingIntervalId = null;
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

  private reset(winner: PlayerComponent): void {
    this.round++;

    const recoverHealth = () => {
      this.myPlayerHealth = 100;
      this.opponentPlayerHealth = 100;
      this.myPlayer.initializePlayer();
      this.opponentPlayer.initializePlayer();
    };

    if (winner === this.myPlayer) {
      this.roundWon = 'You won this round 🎉';
    } else {
      this.roundWon = 'You lost this round 😔';
    }

    setTimeout(() => {
      this.roundWon = '';
      recoverHealth();
    }, 5000);

    if (
      this.match.rounds / this.match.scoreA === 2 ||
      this.match.rounds / this.match.scoreB === 2
    ) {
      if (this.match.rounds / this.match.scoreA === 2) {
        if (this.myPlayer.type === PlayerType.PLAYER_A) {
          this.roundWon = '🎉 You won the match 🎉';
        } else {
          this.roundWon = '😔 You lost the match 😔';
        }
      }
      if (this.match.rounds / this.match.scoreB === 2) {
        if (this.myPlayer.type === PlayerType.PLAYER_B) {
          this.roundWon = '🎉 You won the match 🎉';
        } else {
          this.roundWon = '😔 You lost the match 😔';
        }
      }

      clearInterval(this.movingIntervalId);

      setTimeout(() => {
        this.matchWon = '';
        recoverHealth();
        this.router.navigateByUrl('/');
      }, 5000);
    }
  }

  public ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
    this.socketService.emit('LEAVE_ROOM', this.playerId);
  }
}
