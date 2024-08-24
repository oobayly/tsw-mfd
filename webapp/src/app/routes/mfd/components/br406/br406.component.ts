import { Component, ElementRef, ViewChild } from '@angular/core';
import { MfdBaseComponent } from "../mfd-base/mfd-base.component";
import { DbSemiDigitalDial } from "../../mfd/Db/DbSemiDigitalDial";
import { Size } from "../../mfd/interfaces";
import { radians } from "../../../../core/helpers";
import { DbSemiDigitalTape } from "../../mfd/Db/DbSemiDigitalTape";
import { DbLampPanel } from "../../mfd/Db/DbLampPanel";
import { DbLampNames } from "../../mfd/Db/DbLamps";
import { concat, finalize, mergeMap, tap } from "rxjs";

interface MfdValues {
  distance?: number;
  lamps: DbLampNames[]
  power: number;
  powerTarget?: number;
  speed: number;
  speedTarget?: number;
  speedLimit?: number;
}

@Component({
  selector: 'app-br406',
  standalone: true,
  imports: [],
  templateUrl: './br406.component.html',
  styleUrls: ["../mfd-base/mfd-base.component.scss", './br406.component.scss']
})
export class Br406Component extends MfdBaseComponent {
  protected override readonly mfdName = "DB BR 406";
  protected override readonly size: Size = { width: 699, height: 376 };

  private readonly parts = {
    power: new DbSemiDigitalDial(
      {
        size: 216,
        radius: 95,
        units: "%",
        limits: [{ angle: radians(-210), value: -100 }, { angle: radians(30), value: 100 }],
        ticks: [
          { interval: 5, thickness: 2, ends: [0, 5] },
          { interval: 10, thickness: 2, ends: [- 5, 5] },
          { interval: 50, thickness: 3, ends: [- 8, 8], text: (v) => `${Math.abs(v)}` }
        ]
      },
      { x: 46, y: 7, width: 216, height: 216 }
    ),
    speed: new DbSemiDigitalDial(
      {
        size: 216,
        radius: 95,
        units: "km/h",
        limits: [{ angle: radians(-215), value: 0 }, { angle: radians(35), value: 350 }],
        ticks: [
          { interval: 5, thickness: 2, ends: [0, 5] },
          { interval: 10, thickness: 2, ends: [- 5, 5] },
          { interval: 50, thickness: 3, ends: [- 8, 8], text: true }
        ],
        hasLimit: true
      },
      { x: 444, y: 7, width: 216, height: 216 }
    ),
    lzb: new DbSemiDigitalTape(
      {},
      { x: 317, y: 8, width: 72, height: 233 }
    ),
    lamps: new DbLampPanel(
      {
        radius: 18,
        spacing: { x: 2, y: 11 },
        lamps: [
          ["tbl-end", "ros", "ran", "blank", "sifa", "h-aus", "sbb-fail", "pzb-u", "pzb-m", "pzb-o", "h", "e-40", "ende", "b", "lzb"],
          ["unknown-warn", "g-atb", "blank", "blank", "t", "not-bremse", "sbb-warn", "befehl-40", "pzb-500", "pzb-1000", "g", "unknown-el", "v-40", "s", "lzb-ects"]
        ],
      },
      { x: 69, y: 270, width: 568, height: 83 },
    ),
  };

  private readonly values: MfdValues = {
    power: 0,
    speed: 0,
    lamps: [],
  };

  @ViewChild("container")
  private container?: ElementRef<HTMLElement>;

  @ViewChild("dynamic")
  public dynamic?: ElementRef<HTMLCanvasElement>;

  @ViewChild("static")
  public static?: ElementRef<HTMLCanvasElement>;

  constructor() {
    super();
  }

  protected override onDestroy(): void {
  }

  protected override animate(ts: number): void {
    if (!this.dynamic) {
      return;
    }

    this.renderOnCanvas(this.dynamic.nativeElement, (ctx) => {
      this.parts.power.renderDynamic(ctx, { value: this.values.power, target: this.values.powerTarget });
      this.parts.speed.renderDynamic(ctx, { value: this.values.speed, limit: this.values.speedLimit, target: this.values.speedTarget });
      this.parts.lzb.renderDynamic(ctx, this.values.distance);
      this.parts.lamps.renderDynamic(ctx, this.values.lamps);
    });
  }

  protected override resized(): void {
    if (!this.container || !this.static || !this.dynamic) {
      return;
    }

    const { clientWidth, clientHeight } = this.container.nativeElement;

    this.static.nativeElement.width = clientWidth;
    this.static.nativeElement.height = clientHeight;
    this.dynamic.nativeElement.width = clientWidth;
    this.dynamic.nativeElement.height = clientHeight;

    this.renderOnCanvas(this.static.nativeElement, (ctx) => {
      Object.values(this.parts).forEach((p) => p.renderStatic(ctx));
    });
  }

  protected override selfTest(): void {
    this.subscriptions.push(concat(
      this.parts.power.runSelfTest(5, 1).pipe(
        tap((v) => this.values.power = v),
        finalize(() => this.values.power = 0),
      ),
      this.parts.power.runSelfTest(5, 1).pipe(
        tap((v) => this.values.powerTarget = v),
        finalize(() => this.values.powerTarget = undefined),
      ),
    ).subscribe());

    this.subscriptions.push(concat(
      this.parts.speed.runSelfTest(5).pipe(
        tap((v) => this.values.speed = v),
        finalize(() => this.values.speed = 0),
      ),
      this.parts.speed.runSelfTest(5).pipe(
        tap((v) => this.values.speedTarget = v),
        finalize(() => this.values.speedTarget = undefined),
      ),
    ).subscribe());

    // Speed Limit
    this.subscriptions.push(this.parts.speed.runSelfTest(10).subscribe({
      next: (v) => this.values.speedLimit = v,
      complete: () => this.values.speedLimit = undefined,
    }));

    // LZB distance
    this.subscriptions.push(this.parts.lzb.runSelfTest(10).subscribe({
      next: (v) => this.values.distance = v,
      complete: () => this.values.distance = undefined,
    }));

    // Lamps
    this.subscriptions.push(this.parts.lamps.runSelfTest(10).subscribe({
      next: (v) => this.values.lamps = v,
      complete: () => this.values.lamps = [],
    }));
  }
}
