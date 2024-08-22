import { Component, OnDestroy } from '@angular/core';
import { LeafletControlLayersConfig, LeafletModule } from "@asymmetrik/ngx-leaflet";
import { latLng, Layer, LayersControlEvent, LayersControlEventHandlerFn, LeafletEvent, Map, MapOptions, tileLayer } from "leaflet";
import { SetttingsService } from "../../core/services/setttings.service";
import { filter, map, Observable, startWith } from "rxjs";
import { CommonModule } from "@angular/common";
import { GrayscaleTileLayer } from "./leaflet/GrayscaleTileLayer";

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    LeafletModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnDestroy {
  // ========================
  // Properties
  // ========================

  private readonly attribution = "&copy; <a href='http://www.openrailwaymap.org/copyright'>OpenRailwayMap</a>";

  private readonly baseLayers = {
    'Open Street Map': tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }),
    // "OSM Graysale": new GrayscaleTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }),
    "None": tileLayer(""),
  }

  private readonly overlays = {
    "Standard": tileLayer("https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attribution }),
    "Max Speed": tileLayer("https://tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attribution }),
    "Signals": tileLayer("https://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attribution }),
    "Electrification": tileLayer("https://tiles.openrailwaymap.org/electrification/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attribution }),
    "Gauge": tileLayer("https://tiles.openrailwaymap.org/gauge/{z}/{x}/{y}.png", { maxZoom: 18, attribution: this.attribution }),
  } satisfies Record<string, Layer>;

  public readonly controls: LeafletControlLayersConfig = {
    baseLayers: this.baseLayers,
    overlays: this.overlays,
  };

  private leaflet?: Map;

  // ========================
  // Observables
  // ========================

  public readonly options$: Observable<MapOptions>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly settings: SetttingsService,
  ) {
    this.options$ = this.settings.getSetting("map").pipe(
      map((settings) => {
        const layers = Object.entries({ ...this.overlays, ...this.baseLayers })
          .filter(([k]) => settings?.layers.includes(k))
          .map(([_, v]) => v)
          ;

        if (!layers.length) {
          layers.push(this.baseLayers["Open Street Map"], this.overlays["Max Speed"]);
        }

        return {
          layers,
          zoom: settings?.zoom ?? 12,
          center: latLng(settings?.lat ?? 50.94, settings?.lng ?? 6.96), // Default to Köln 50.94349200960879, 6.9581831729137456
        } satisfies MapOptions;
      })
    )
  }

  ngOnDestroy(): void {
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

    await this.settings.updateSetting("map", {
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

  public onMoveMove(e: LeafletEvent): void {
    // void this.updateSettings();
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
