import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected isLandscape: boolean = false;
  protected alert = alert;

  constructor(private uiService: UiService) {
    this.isLandscape = this.uiService.isLandscape;
  }

  protected router = new Router();
  protected matchId: string = '';

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isLandscape = window.matchMedia('(orientation: landscape)').matches;
  }
}
