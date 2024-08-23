import { CommonModule } from "@angular/common";
import { Component, importProvidersFrom } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterModule, RouterOutlet, UrlTree } from '@angular/router';
import { NgbModal, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { filter, map, Observable, of, share, startWith, tap } from "rxjs";
import { MfdControlsService, MfdOptions } from "./core/services/mfd-controls.service";
import { SettingsKey } from "./core/services/setttings.service";
import { MapSettingsModalComponent } from "./routes/map/components/map-settings-modal/map-settings-modal.component";

interface LastMfd {
  name: string;
  path: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    NgbTooltipModule
  ],
  providers: [MfdControlsService],
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

  public readonly lastMfd$: Observable<LastMfd>;

  public readonly navLeft$: Observable<boolean>;

  public readonly navRight$: Observable<boolean>;

  public readonly settings$: Observable<SettingsKey | undefined>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    public readonly mfdControls: MfdControlsService,
    private readonly modal: NgbModal,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.settings$ = this.getSettingsKey();
    this.lastMfd$ = this.getLastMdfObservable();
    this.navSide$ = of("left");

    this.navLeft$ = this.navSide$.pipe(map((x) => x === "left"));
    this.navRight$ = this.navSide$.pipe(map((x) => x === "right"));
  }

  // ========================
  // Methods
  // ========================

  public getLastMdfObservable(): Observable<LastMfd> {
    return this.mfdControls.mfd$.pipe(
      filter((mfd) => !!mfd),
      map((mfd) => {
        const path: string[] = [];

        for (let snapshot = this.route.snapshot.root; !!snapshot; snapshot = snapshot.firstChild!) {
          if (snapshot.routeConfig?.path) {
            path.push(snapshot.routeConfig.path);
          }
        }

        return {
          name: mfd.name,
          path: "/" + path.join("/"),
        }
      }),
    );
  }

  public getSettingsKey(): Observable<SettingsKey | undefined> {
    return this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      tap(() => {
        this.modal.dismissAll();
      }),
      startWith(undefined),
      map(() => {
        const path: string[] = [];

        for (let snapshot = <ActivatedRouteSnapshot | null>this.route.snapshot.root; !!snapshot; snapshot = snapshot.firstChild) {
          if (snapshot.routeConfig?.path) {
            path.push(snapshot.routeConfig.path);
          }
        }

        if (path[0] === "map") {
          return "map";
        }

        return undefined;
      }),
      tap((k) => console.log(k)),
    )
  }

  // ========================
  // Methods
  // ========================

  public async onSettingClick(key: SettingsKey): Promise<void> {
    if (key === "map") {
      this.modal.open(MapSettingsModalComponent, { centered: true });
    }
  }
}
