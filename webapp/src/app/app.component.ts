import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { NgbModal, NgbTooltipConfig, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { LatLngLiteral } from "leaflet";
import { BehaviorSubject, filter, map, Observable, of } from "rxjs";
import { MfdControlsService } from "./core/services/mfd-controls.service";
import { AnySocketEvent, TswSocketService } from "./core/services/tsw-socket.service";
import { SettingsModalComponent } from "./modals/settings-modal/settings-modal.component";

interface LastMfd {
  name: string;
  path: string;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    NgbTooltipModule,
  ],
  providers: [MfdControlsService],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnDestroy {
  title = "webapp";

  // ========================
  // Observables
  // ========================

  public readonly isFullscreen$ = new BehaviorSubject(!!document.fullscreenElement);

  public readonly navSide$: Observable<"left" | "right">;

  // ========================
  // Derived observables
  // ========================

  public readonly isConnected$: Observable<boolean>;

  public readonly lastMfd$: Observable<LastMfd>;

  public readonly navLeft$: Observable<boolean>;

  public readonly navRight$: Observable<boolean>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    public readonly mfdControls: MfdControlsService,
    private readonly modal: NgbModal,
    readonly tooltip: NgbTooltipConfig,
    private readonly route: ActivatedRoute,
    readonly socket: TswSocketService,
  ) {
    tooltip.triggers = "hover";

    this.isConnected$ = socket.socket$.pipe(map((x) => !!x));
    this.lastMfd$ = this.getLastMdfObservable();
    this.navSide$ = of("left");

    this.navLeft$ = this.navSide$.pipe(map((x) => x === "left"));
    this.navRight$ = this.navSide$.pipe(map((x) => x === "right"));

    socket.fromAny<{ event: "client_id", args: string } | { event: "latlng", args: LatLngLiteral } | AnySocketEvent>("latlng", "client_id").pipe(
    ).subscribe({
      next: (e) => {
        if (e.event === "client_id") {
          console.log(`Connected with ClientId: ${e.args}`);
        } else if (e.event === "latlng") {
          const { lat, lng } = e.args;
          console.log(`Got new location: lat: ${lat} lng: ${lng}`);
        } else {
          const { event, args } = e as unknown as AnySocketEvent;
          console.log(`Got other event: ${event}`, args);
        }
      },
      complete: () => console.log("completed"),
    });

    document.addEventListener("fullscreenchange", this.onFullscreenChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
  }

  // ========================
  // Methods
  // ========================

  public getLastMdfObservable(): Observable<LastMfd> {
    return this.mfdControls.mfd$.pipe(
      filter((mfd) => !!mfd),
      map((mfd) => {
        const path: string[] = [];

        for (let snapshot = this.route.snapshot.root; snapshot; snapshot = snapshot.firstChild!) {
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

  // ========================
  // Methods
  // ========================

  public async onFullscreenToggle(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.body.requestFullscreen()
    }
  }

  public onFullscreenChange = (_: Event) => {
    this.isFullscreen$.next(!!document.fullscreenElement);
  }

  public async onSettingClick(): Promise<void> {
    this.modal.open(SettingsModalComponent, { centered: true });
  }
}
