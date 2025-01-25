import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  public isMobile: boolean = false;
  public isLandscape: boolean = false;

  constructor() {
    const userAgent: string =
      navigator.userAgent || navigator.vendor || (window as any)['opera'];

    this.isMobile = /android|iphone|ipad|iPod|opera mini|iemobile|mobile/i.test(
      userAgent
    );

    this.isLandscape = window.matchMedia('(orientation: landscape)').matches;
  }
}
