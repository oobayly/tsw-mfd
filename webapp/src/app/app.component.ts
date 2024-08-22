import { CommonModule } from "@angular/common";
import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet, UrlTree } from '@angular/router';
import { filter, map, Observable, of, startWith } from "rxjs";

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

  public readonly lastMfd$: Observable<any>;

  public readonly navLeft$: Observable<boolean>;

  public readonly navRight$: Observable<boolean>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.lastMfd$ = this.getLastMdfObservable();
    this.navSide$ = of("left");

    this.navLeft$ = this.navSide$.pipe(map((x) => x === "left"));
    this.navRight$ = this.navSide$.pipe(map((x) => x === "right"));
  }

  // ========================
  // Methods
  // ========================

  public getLastMdfObservable(): Observable<string[]> {
    return this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(undefined),
      map(() => {
        const path: string[] = [];

        for (let snapshot = this.route.snapshot.root; !!snapshot; snapshot = snapshot.firstChild!) {
          if (snapshot.routeConfig?.path) {
            path.push(snapshot.routeConfig.path);
          }
        }

        if (path[0] === "mfd" && path.length > 1) {
          return [".", ...path];
        }

        return undefined;
      }),
      filter((x): x is string[] => !!x)
    );
  }
}
