import { CommonModule } from "@angular/common";
import { Component, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { LeafletControlLayersConfig, LeafletModule } from "@asymmetrik/ngx-leaflet";
import { Control, latLng, LatLngTuple, Layer, LayersControlEvent, LeafletEvent, Map, MapOptions, tileLayer } from "leaflet";
import { catchError, debounceTime, distinctUntilChanged, first, map, Observable, of, shareReplay, Subject, Subscription, switchMap, takeUntil, timeout } from "rxjs";
import { MapSettings, SetttingsService } from "../../core/services/setttings.service";
import { TswSocketService } from "../../core/services/tsw-socket.service";

@Component({
  selector: "app-map",
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    LeafletModule,
  ],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements OnDestroy {
  // ========================
  // Fields
  // ========================

  // ========================
  // Properties
  // ========================

  private readonly attributions = {
    osm: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
    orm: "&copy; <a href='http://www.openrailwaymap.org/copyright'>OpenRailwayMap</a>",
  };

  private readonly baseLayers = {
    "OSM": tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      id: "osm",
      maxZoom: 18,
      attribution: this.attributions.osm,
      className: "baselayer",
    }),
    "OSM Grayscale": tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      id: "osm-gray",
      maxZoom: 18,
      attribution: this.attributions.osm,
      className: "baselayer grayscale",
    }),
    "None": tileLayer("", { id: "blank" }),
  }

  public followLocation = false;

  private readonly overlays = {
    "Standard": tileLayer("https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attributions.orm }),
    "Max Speed": tileLayer("https://tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attributions.orm }),
    "Signals": tileLayer("https://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attributions.orm }),
    "Electrification": tileLayer("https://tiles.openrailwaymap.org/electrification/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attributions.orm }),
    "Gauge": tileLayer("https://tiles.openrailwaymap.org/gauge/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attributions.orm }),
  } satisfies Record<string, Layer>;

  public readonly controls: LeafletControlLayersConfig = {
    baseLayers: this.baseLayers,
    overlays: this.overlays,
  };

  private leaflet?: Map;

  private readonly subscriptions: Subscription[] = [];

  // ========================
  // Observables
  // ========================

  public readonly brightness$: Observable<number>;

  public readonly location$: Observable<LatLngTuple>;

  public readonly options$: Observable<MapOptions>;

  private readonly destroy$ = new Subject<void>();

  private readonly updateSettings$ = new Subject<Partial<MapSettings>>();

  // ========================
  // View children
  // ========================

  @ViewChild("locationButton")
  private locationButton!: TemplateRef<unknown>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly settings: SetttingsService,
    private readonly socket: TswSocketService,
  ) {
    const settings$ = this.settings.watchSetting("map").pipe(
      takeUntil(this.destroy$),
      shareReplay(1),
    );

    this.brightness$ = settings$.pipe(
      map((x) => x?.brightness ?? 1),
      distinctUntilChanged(),
    );

    this.options$ = settings$.pipe(
      first(),
      map((settings) => {
        let layers: Layer[];

        if (settings?.layers) {
          layers = Object.entries({ ...this.overlays, ...this.baseLayers })
            .filter(([k]) => settings?.layers?.includes(k))
            .map(([_, v]) => v)
            ;
        } else {
          layers = [];
        }

        if (!layers.length) {
          layers.push(this.baseLayers["OSM"], this.overlays["Max Speed"]);
        }

        return {
          layers,
          zoom: settings?.zoom ?? 12,
          center: latLng(settings?.lat ?? 50.94, settings?.lng ?? 6.96), // Default to Köln 50.94349200960879, 6.9581831729137456
        } satisfies MapOptions;
      }),
    );

    this.location$ = socket.fromEvent<LatLngTuple>("latlng").pipe(
      takeUntil(this.destroy$),
      shareReplay(1),
    );

    // Only save settings every 5 seconds
    this.subscriptions.push(this.updateSettings$.pipe(
      debounceTime(5000),
      switchMap((settings) => this.settings.patchSetting("map", settings)),
    ).subscribe());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.subscriptions.forEach((s) => s.unsubscribe());

    this.leaflet?.removeEventListener("overlayadd", this.onOverlayAdd);
    this.leaflet?.removeEventListener("overlayremove", this.onOverlayRemove);
    this.leaflet?.removeEventListener("baselayerchange", this.onBaseLayerChange);
  }

  // ========================
  // Methods
  // ========================

  private updateSettings(): void {
    if (!this.leaflet) {
      return;
    }

    const layers: string[] = [];
    const { lat, lng } = this.leaflet.getCenter();
    const zoom = this.leaflet.getZoom();

    this.leaflet.eachLayer((layer) => {
      const name =
        Object.entries(this.baseLayers).find(([, v]) => v === layer)?.[0]
        ?? Object.entries(this.overlays).find(([, v]) => v === layer)?.[0];

      if (name) {
        layers.push(name);
      }
    });

    this.updateSettings$.next({
      layers,
      lat, lng,
      zoom,
    });
  }

  // ========================
  // Event handlers
  // ========================

  private onBaseLayerChange = (_: LayersControlEvent): void => {
    void this.updateSettings();
  }

  public async onLocationClick(e: Event): Promise<void> {
    e.preventDefault();

    this.followLocation = true;

    try {
      (await this.socket.emit("latlng?"));
    } catch {
      // 
      return;
    }

    this.location$.pipe(
      timeout(50),
      first(),
      catchError(() => of(undefined)),
    ).subscribe({
      next: (p) => {
        if (p) {
          this.leaflet?.panTo(p);
        }
      },
    });
  }

  public onMapMove(_: LeafletEvent): void {
    void this.updateSettings();
  }

  public onMapMouseDown(_: LeafletEvent): void {
    this.followLocation = false;
  }

  public onMapReady(e: Map): void {
    this.leaflet = e;

    const scale = new Control.Scale({
      maxWidth: 400,
      imperial: false,
      position: "bottomright",
      updateWhenIdle: true,
    });
    scale.addTo(this.leaflet);

    this.leaflet.addEventListener("overlayadd", this.onOverlayAdd);
    this.leaflet.addEventListener("overlayremove", this.onOverlayRemove);
    this.leaflet.addEventListener("baselayerchange", this.onBaseLayerChange);

    // Add the custom location control
    const ctl = new Control();
    ctl.onAdd = () => {
      const elem = this.locationButton.createEmbeddedView(null);

      elem.detectChanges();

      return elem.rootNodes[0];
    }
    ctl.options = {
      position: "bottomleft",
    };
    ctl.addTo(this.leaflet);

    // Listen for location changes
    this.subscriptions.push(this.location$.pipe(
    ).subscribe((current) => {
      if (!this.leaflet || !this.followLocation) {
        return;
      }

      this.leaflet?.panTo(current);
    }));
  }

  private onOverlayAdd = (_: LayersControlEvent) => {
    void this.updateSettings();
  }

  private onOverlayRemove = (_: LayersControlEvent) => {
    void this.updateSettings();
  }
}
