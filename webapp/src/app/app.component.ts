import { CommonModule } from "@angular/common";
import { Component, importProvidersFrom } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterModule, RouterOutlet, UrlTree } from '@angular/router';
import { NgbModal, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { filter, map, Observable, of, share, startWith, tap } from "rxjs";
import { MfdControlsService, MfdOptions } from "./core/services/mfd-controls.service";
import { SettingsKey } from "./core/services/setttings.service";
import { MapSettingsModalComponent } from "./routes/map/components/map-settings-modal/map-settings-modal.component";
import { Socket } from "ngx-socket-io";
import { TswSocketService } from "./core/services/tsw-socket.service";

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

  public readonly isConnected$: Observable<boolean>;

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
    private readonly socket: TswSocketService,
  ) {
    this.isConnected$ = socket.socket$.pipe(map((x) => !!x));
    this.settings$ = this.getSettingsKey();
    this.lastMfd$ = this.getLastMdfObservable();
    this.navSide$ = of("left");

    this.navLeft$ = this.navSide$.pipe(map((x) => x === "left"));
    this.navRight$ = this.navSide$.pipe(map((x) => x === "right"));

    console.time("got-now");

    let last = Date.now();

    socket.fromEvent("client_id").subscribe((x) => {
      console.log("client_id", x);
    })

    socket.fromEvent<{ lat: number, lng: number }>("latlng").subscribe((p) => {
      console.log(p);
    })

    // socket.fromEvent("now").subscribe((x) => {
    //   const now = Date.now();
    //   const dT = now - last;

    //   console.timeLog("got-now", x, dT);

    //   last = now;
    // });
    // socket.fromEvent("date").subscribe((x) => {
    //   console.log("date", x);
    // });

    // window.setInterval(() => {
    //   console.log("Requesting date");
    //   socket.emit("date?");
    // }, 10000)

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
    )
  }

  // ========================
  // Methods
  // ========================

  public async onDebugClick(): Promise<void> {
    const socket = await this.socket.getSocket();

    if (!socket) {
      return;
    }

    socket.fromOneTimeEvent<number>("now").then((e) => {
      const now = Date.now();

      console.log("RTT", now - then);
    });

    const then = Date.now();
    socket.emit("now");
  }

  public async onSettingClick(key: SettingsKey): Promise<void> {
    if (key === "map") {
      this.modal.open(MapSettingsModalComponent, { centered: true });
    }
  }
}
