import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss',
})
export class PlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ragdoll') ragdoll: ElementRef<HTMLElement>;

  @Input() type: PlayerType = PlayerType.PLAYER_A;

  public keyHeld: Subject<any> = new Subject();

  protected PlayerType = PlayerType;

  private currentPlayerDirection: PlayerDirection;
  private currentPlayerPosition: PlayerPosition;
  private observer!: IntersectionObserver;

  constructor() {}

  public ngOnInit(): void {
    this.keyHeld.subscribe((key) => {
      this.movePlayer(key);

      if (key === ' ') {
        this.shoot();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializePlayer();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initIntersectionObserver(element: HTMLElement) {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.currentPlayerPosition = {
            x: entry.boundingClientRect.x,
            y: entry.boundingClientRect.y,
          };
        });
      },
      { root: null, threshold: [0, 1.0] }
    );

    this.observer.observe(element);
  }

  private initializePlayer = (): void => {
    const player = this.ragdoll.nativeElement;

    if (this.type === PlayerType.PLAYER_A) {
      player.style.left = 'calc(100dvw - 70px)';
      player.style.transform = 'rotate(180deg)';
      this.currentPlayerDirection = PlayerDirection.LEFT;
    } else {
      player.style.left = '10px';
      this.currentPlayerDirection = PlayerDirection.RIGHT;
    }
  };

  private movePlayer(key: string): void {
    const player = this.ragdoll.nativeElement;
    const arena = this.ragdoll.nativeElement.parentElement?.parentElement;

    this.initIntersectionObserver(player);

    const allowMoveLeft = player.offsetLeft > 10;
    const allowMoveRight = player.offsetLeft < arena!.clientWidth - 50;
    const allowMoveTop = player.offsetTop > 10;
    const allowMoveDown = player.offsetTop < arena!.clientHeight - 50;

    switch (key) {
      case 'ArrowUp':
        if (allowMoveTop) {
          player.style.top = player.offsetTop - 10 + 'px';
          this.rotatePlayer(PlayerDirection.UP);
          this.currentPlayerDirection = PlayerDirection.UP;
        }
        break;
      case 'ArrowDown':
        if (allowMoveDown) {
          player.style.top = player.offsetTop + 10 + 'px';
          this.rotatePlayer(PlayerDirection.DOWN);
          this.currentPlayerDirection = PlayerDirection.DOWN;
        }
        break;
      case 'ArrowLeft':
        if (allowMoveLeft) {
          player.style.left = player.offsetLeft - 10 + 'px';
          this.rotatePlayer(PlayerDirection.LEFT);
          this.currentPlayerDirection = PlayerDirection.LEFT;
        }
        break;
      case 'ArrowRight':
        if (allowMoveRight) {
          player.style.left = player.offsetLeft + 10 + 'px';
          this.rotatePlayer(PlayerDirection.RIGHT);
          this.currentPlayerDirection = PlayerDirection.RIGHT;
        }
        break;
    }
  }

  private rotatePlayer(direction: PlayerDirection): void {
    const player = this.ragdoll.nativeElement;

    switch (direction) {
      case PlayerDirection.UP:
        player.style.transform = 'rotate(270deg)';
        break;
      case PlayerDirection.DOWN:
        player.style.transform = 'rotate(90deg)';
        break;
      case PlayerDirection.LEFT:
        player.style.transform = 'rotate(180deg)';
        break;
      case PlayerDirection.RIGHT:
        player.style.transform = 'rotate(0deg)';
        break;
    }
  }

  private shoot(): void {
    const player = this.ragdoll.nativeElement;
    const arena = this.ragdoll.nativeElement.parentElement!.parentElement;

    const bullet = document.createElement('a');
    bullet.id = 'bullet';

    bullet.style.position = 'absolute';
    bullet.style.width = '5px';
    bullet.style.height = '5px';
    bullet.style.borderRadius = '50%';
    bullet.style.backgroundColor = 'whitesmoke';
    bullet.style.boxShadow = '0px 0px 5px #000000';

    let translateX = 0;
    let translateY = 0;

    switch (this.currentPlayerDirection) {
      case PlayerDirection.UP:
        bullet.style.top = player.offsetTop - 10 + 'px';
        bullet.style.left = player.offsetLeft + 24 + 'px';
        translateY = -100;
        break;
      case PlayerDirection.DOWN:
        bullet.style.top = player.offsetTop + 44 + 'px';
        bullet.style.left = player.offsetLeft + 11 + 'px';
        translateY = 100;
        break;
      case PlayerDirection.RIGHT:
        bullet.style.top = player.offsetTop + 24 + 'px';
        bullet.style.left = player.offsetLeft + 44 + 'px';
        translateX = 100;
        break;
      case PlayerDirection.LEFT:
        bullet.style.top = player.offsetTop + 11 + 'px';
        bullet.style.left = player.offsetLeft - 10 + 'px';
        translateX = -100;
        break;
    }

    bullet.style.transition = 'all 1s';

    arena!.appendChild(bullet);

    setTimeout(() => {
      for (let i = 0; i <= 100; i++) {
        if (translateX) {
          bullet.style.transform = `translateX(${translateX > 0 ? i : -i}dvw)`;
        }
        if (translateY) {
          bullet.style.transform = `translateY(${translateY > 0 ? i : -i}dvh)`;
        }
      }
    }, 10);

    setTimeout(() => {
      bullet.remove();
    }, 1000);
  }
}

export enum PlayerType {
  PLAYER_A,
  PLAYER_B,
}

export enum PlayerDirection {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export interface PlayerPosition {
  x: number;
  y: number;
}
