import { Component } from '@angular/core';
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { latLng, tileLayer } from "leaflet";

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [LeafletModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  public readonly options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
      // tileLayer("https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"),
      tileLayer("https://tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png"),
      // tileLayer("https://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png"),
      // tileLayer("https://tiles.openrailwaymap.org/electrification/{z}/{x}/{y}.png"),
      // tileLayer("https://tiles.openrailwaymap.org/gauge/{z}/{x}/{y}.png"),
    ],
    zoom: 5,
    center: latLng(46.879966, -121.726909)
  }
}
