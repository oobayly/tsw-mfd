import { CommonModule } from "@angular/common";
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { map, Observable, of } from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'webapp';

  // ========================
  // Observables
  // ========================

  public readonly navSide$: Observable<"left" | "right">;

  // ========================
  // Derived observables
  // ========================

  public readonly navLeft$: Observable<boolean>

  public readonly navRight$: Observable<boolean>

  // ========================
  // Lifecycle
  // ========================

  constructor() {
    this.navSide$ = of("left");

    this.navLeft$ = this.navSide$.pipe(map((x) => x === "left"));
    this.navRight$ = this.navSide$.pipe(map((x) => x === "right"));
  }
}
