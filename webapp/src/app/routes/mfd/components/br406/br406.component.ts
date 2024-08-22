import { Component, ElementRef, ViewChild } from '@angular/core';
import { MfdBaseComponent } from "../mfd-base/mfd-base.component";
import { DbSemiDigitalDial } from "../../mfd/Db/DbSemiDigitalDial";
import { Size } from "../../mfd/interfaces";
import { radians } from "../../../../core/helpers";
import { DbSemiDigitalTape } from "../../mfd/Db/DbSemiDigitalTape";
import { interval, timer } from "rxjs";
import { DbLampPanel } from "../../mfd/Db/DbLampPanel";
import { DbLampNames } from "../../mfd/Db/DbLamps";

@Component({
  selector: 'app-br406',
  standalone: true,
  imports: [],
  templateUrl: './br406.component.html',
  styleUrls: ["../mfd-base/mfd-base.component.scss", './br406.component.scss']
})
export class Br406Component extends MfdBaseComponent {
  protected override size: Size = { width: 699, height: 376 };

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
        ]
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

  private readonly values = {
    power: { value: 0, delta: .25, min: -100, max: 100 },
    powerTarget: { value: 20, delta: .25, min: -100, max: 100 },
    distance: { value: 9999, delta: 25, min: 0, max: 9999 },
    speed: { value: 0, delta: .5, min: 0, max: 350 },
    speedTarget: { value: 40, delta: .5, min: 0, max: 350 },
    lamps: { value: <DbLampNames | undefined>undefined },
  }; // satisfies Record<string, { value: number, delta: number, min: number, max: number }>;

  @ViewChild("container")
  private container?: ElementRef<HTMLElement>;

  @ViewChild("dynamic")
  public dynamic?: ElementRef<HTMLCanvasElement>;

  @ViewChild("static")
  public static?: ElementRef<HTMLCanvasElement>;

  constructor() {
    super();

    // this.subscriptions.push(interval(5).subscribe(() => {
    //   Object.values(this.values).forEach((x) => {
    //     if (typeof x.value === "number") {
    //       x.value += x.delta;
    //       if (x.value < x.min) {
    //         x.value = x.min;
    //         x.delta *= -1;
    //       } else if (x.value > x.max) {
    //         x.value = x.max;
    //         x.delta *= -1;
    //       }
    //     }
    //   });
    // }));

    // this.subscriptions.push(interval(1000).subscribe(() => {
    //   Object.values(this.values).forEach((x) => {
    //     if (typeof x.value === "number") {
    //     } else {
    //       const allNames = this.parts.lamps.options.lamps
    //         .reduce((accum, names) => {
    //           return [...accum, ...names];
    //         }, <DbLampNames[]>[])
    //         .filter((name): name is DbLampNames => name !== "blank")
    //         ;
    //       let index = (x.value ? allNames.indexOf(x.value) : -1) + 1;

    //       if (index >= allNames.length) {
    //         index = 0;
    //       }

    //       x.value = allNames[index];
    //     }
    //   });
    // }));
  }

  protected override onDestroy(): void {
  }

  protected override animate(ts: number): void {
    if (!this.dynamic) {
      return;
    }

    this.renderOnCanvas(this.dynamic.nativeElement, (ctx) => {
      this.parts.power.renderDynamic(ctx, { value: this.values.power.value, target: this.values.powerTarget.value });
      this.parts.speed.renderDynamic(ctx, { value: this.values.speed.value, limit: 0, target: this.values.speedTarget.value });
      this.parts.lzb.renderDynamic(ctx, this.values.distance.value);
      this.parts.lamps.renderDynamic(ctx, this.values.lamps.value ? [this.values.lamps.value] : []);
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
}
