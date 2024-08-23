import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { LeafletControlLayersConfig, LeafletModule } from "@asymmetrik/ngx-leaflet";
import { latLng, Layer, LayersControlEvent, LeafletEvent, Map, MapOptions, tileLayer } from "leaflet";
import { SetttingsService } from "../../core/services/setttings.service";
import { BehaviorSubject, map, Observable, take, tap } from "rxjs";
import { CommonModule } from "@angular/common";

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
  // Fields
  // ========================

  private _leafletContainer?: ElementRef<HTMLElement>;

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
      attribution: this.attributions.osm
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

  // ========================
  // Observables
  // ========================

  public readonly brightnes$ = new BehaviorSubject("brightness(1)");

  public readonly options$: Observable<MapOptions>;

  // ========================
  // View children
  // ========================

  @ViewChild("leafletContainer", { static: false })
  private set leafletContainer(value: ElementRef<HTMLElement> | undefined) {
    // Bit hacky, but this may be undefined in ngAfterViewInit, so we update the Grayscale layer from here
    this._leafletContainer = value;
    this.updateGrayscaleLayer();
  };
  private get leafletContainer(): ElementRef<HTMLElement> | undefined {
    return this._leafletContainer;
  }

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
          layers.push(this.baseLayers["OSM"], this.overlays["Max Speed"]);
        }

        return {
          layers,
          zoom: settings?.zoom ?? 12,
          center: latLng(settings?.lat ?? 50.94, settings?.lng ?? 6.96), // Default to Köln 50.94349200960879, 6.9581831729137456
        } satisfies MapOptions;
      }),
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

  private updateGrayscaleLayer() {
    if (!this.leafletContainer) {
      return;
    }

    // Bit hacky, but this is the only way to target the leaflet-layer that has the Grayscale OSM tiles.
    const baseLayers = this.leafletContainer.nativeElement.getElementsByClassName("leaflet-layer");

    Array.from(baseLayers).forEach((l) => {
      const zIndex = l.computedStyleMap().get("z-index");

      if (zIndex?.toString() == "2") {
        l.classList.add("grayscale");
      }
    })
  }

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
    this.updateGrayscaleLayer();
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
