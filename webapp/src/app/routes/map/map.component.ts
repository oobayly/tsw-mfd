import { Component, OnDestroy } from '@angular/core';
import { LeafletControlLayersConfig, LeafletModule } from "@asymmetrik/ngx-leaflet";
import { latLng, Layer, LayersControlEvent, LeafletEvent, Map, MapOptions, TileLayer, tileLayer } from "leaflet";
import { SetttingsService } from "../../core/services/setttings.service";
import { combineLatest, distinctUntilChanged, first, map, Observable, shareReplay, Subscription } from "rxjs";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { TswSocketService } from "../../core/services/tsw-socket.service";

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    LeafletModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnDestroy {
  // ========================
  // Fields
  // ========================

  // ========================
  // Properties
  // ========================

  private readonly attributions = {
    osm: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    orm: "&copy; <a href='http://www.openrailwaymap.org/copyright'>OpenRailwayMap</a>",
  };

  private readonly baseLayers = {
    'OSM': tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: "osm",
      maxZoom: 18,
      attribution: this.attributions.osm
    }),
    'OSM Grayscale': tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: "osm-gray",
      maxZoom: 18,
      attribution: this.attributions.osm,
      className: "grayscale"
    }),
    "None": tileLayer("", { id: "blank" }),
  }

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

  public readonly options$: Observable<MapOptions>;

  // ========================
  // View children
  // ========================

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly settings: SetttingsService,
    private readonly socket: TswSocketService,
  ) {
    const settings$ = this.settings.watchSetting("map").pipe(shareReplay(1));

    this.brightness$ = settings$.pipe(
      map((x) => x?.brightness ?? 1),
      distinctUntilChanged(),
    );

    this.options$ = settings$.pipe(
      first(),
      map((settings) => {
        let layers: TileLayer[];

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

    this.subscriptions.push(socket.fromEvent<{ lat: number, lng: number }>("latlng").subscribe((p) => {
      this.leaflet?.panTo(p);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());

    this.leaflet?.removeEventListener("overlayadd", this.onOverlayAdd);
    this.leaflet?.removeEventListener("overlayremove", this.onOverlayRemove);
    this.leaflet?.removeEventListener("baselayerchange", this.onBaseLayerChange);
  }

  // ========================
  // Methods
  // ========================

  private async updateSettings(): Promise<void> {
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

    await this.settings.patchSetting("map", {
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

  public onMapMove(e: LeafletEvent): void {
    void this.updateSettings();
  }

  public onMapReady(e: Map): void {
    this.leaflet = e;

    this.leaflet.addEventListener("overlayadd", this.onOverlayAdd);
    this.leaflet.addEventListener("overlayremove", this.onOverlayRemove);
    this.leaflet.addEventListener("baselayerchange", this.onBaseLayerChange);
  }

  private onOverlayAdd = (_: LayersControlEvent) => {
    void this.updateSettings();
  }

  private onOverlayRemove = (_: LayersControlEvent) => {
    void this.updateSettings();
  }
}
