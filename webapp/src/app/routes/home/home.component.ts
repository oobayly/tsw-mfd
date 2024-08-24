import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Observable, of } from "rxjs";

interface HomeCard {
  title: string;
  description: string;
  path: string;
  image: string;
}

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  public readonly cards$: Observable<HomeCard[]> = of([
    { title: "Rail Map", description: "Railway Map from OpenRailwayMap.org", path: "/map", image: "/images/cards/openrailwaymap.png" },
    { title: "DB BR 406", description: "DB ICE 3M", path: "/mfd/br406", image: "/images/cards/db-br-406.png" },
  ]);
}
