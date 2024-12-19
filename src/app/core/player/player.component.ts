import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit {
  @ViewChild('ragdoll') ragdoll: ElementRef<HTMLElement>;

  @Input() type: PlayerType = PlayerType.PLAYER_A;

  protected color: string = '#000000';
  protected left: string = '0px';

  public keyHeld: Subject<any> = new Subject();

  constructor() {}

  public ngOnInit(): void {
    this.initializePlayer();

    this.keyHeld.subscribe((key) => {
      this.movePlayer(key);
    });
  }

  private initializePlayer = (): void => {
    if (this.type === PlayerType.PLAYER_A) {
      this.left = 'calc(100dvw - 70px)';
      this.color = '#ff0000';
    } else {
      this.left = '10px';
      this.color = '#0000ff';
    }
  };

  private movePlayer(key: string): void {
    const player = this.ragdoll.nativeElement;
    const arena = this.ragdoll.nativeElement.parentElement?.parentElement;

    const allowMoveLeft = player.offsetLeft > 10;
    const allowMoveRight = player.offsetLeft < arena!.clientWidth - 50;
    const allowMoveTop = player.offsetTop > 10;
    const allowMoveDown = player.offsetTop < arena!.clientHeight - 50;

    switch (key) {
      case 'ArrowUp':
        allowMoveTop && (player.style.top = player.offsetTop - 10 + 'px');
        break;
      case 'ArrowDown':
        allowMoveDown && (player.style.top = player.offsetTop + 10 + 'px');
        break;
      case 'ArrowLeft':
        allowMoveLeft && (player.style.left = player.offsetLeft - 10 + 'px');
        break;
      case 'ArrowRight':
        allowMoveRight && (player.style.left = player.offsetLeft + 10 + 'px');
        break;

      default:
        break;
    }
  }
}

export enum PlayerType {
  PLAYER_A,
  PLAYER_B,
}
