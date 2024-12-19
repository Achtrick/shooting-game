import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Room } from '../../models/room.model';
import { SocketService } from '../../services/socket.service';
import { PlayerComponent, PlayerType } from '../player/player.component';

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [CommonModule, PlayerComponent],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss',
})
export class ArenaComponent implements OnInit {
  @ViewChild('playerA') playerA!: PlayerComponent;
  @ViewChild('playerB') playerB!: PlayerComponent;

  public loading: boolean = true;
  public loadingText: string = 'finding match ...';
  public room: Room = new Room();

  protected playerId: string;
  protected playerType: PlayerType;
  protected PlayerType = PlayerType;

  private myPlayer: PlayerComponent;
  private otherPlayer: PlayerComponent;
  private isKeyHeld: boolean = false;
  private keyBeingHeld: string = '';
  private intervalId: any = null;

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

    this.socketService.on('MOVE', (direction) => {
      if (!this.isKeyHeld) {
        this.otherPlayer.keyHeld.next(direction);
      }
    });
  }

  private async joinMatch(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      this.room = await this.socketService.joinMatch(
        localStorage.getItem('PLAYER_ID') ?? crypto.randomUUID()
      );

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

      this.otherPlayer =
        this.playerType === PlayerType.PLAYER_A ? this.playerB : this.playerA;

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
}
