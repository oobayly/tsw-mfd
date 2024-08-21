import { Component, ElementRef, ViewChild } from '@angular/core';
import { MfdBaseComponent } from "../mfd-base/mfd-base.component";
import { DbSemiDigitalDial } from "../../mfd/DbSemiDigitalDial";
import { Size } from "../../mfd/interfaces";
import { radians } from "../../../../core/helpers";

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
        pips: [
          { interval: 5, width: 2, ends: [0, 5] },
          { interval: 10, width: 2, ends: [- 5, 5] },
          { interval: 50, width: 3, ends: [- 8, 8], text: true }
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
        pips: [
          { interval: 5, width: 2, ends: [0, 5] },
          { interval: 10, width: 2, ends: [- 5, 5] },
          { interval: 50, width: 3, ends: [- 8, 8], text: true }
        ]
      },
      { x: 444, y: 7, width: 216, height: 216 }
    )
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
      this.parts.power.renderDynamic(ctx, { value: 7, target: 35 });
      this.parts.speed.renderDynamic(ctx, { value: 87, limit: 0, target: 120 });
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
      // ctx.fillStyle = "#ff000080";
      // ctx.fillRect(0, 0, this.size.width, this.size.height);
      // ctx.fillRect(this.parts.power.bounds.x, this.parts.power.bounds.y, this.parts.power.bounds.width, this.parts.power.bounds.height);
      // ctx.fillRect(this.parts.speed.bounds.x, this.parts.speed.bounds.y, this.parts.speed.bounds.width, this.parts.speed.bounds.height);

      Object.values(this.parts).forEach((p) => p.renderStatic(ctx));
    });

    // const ctx = this.static.nativeElement.getContext("2d")!;
    // ctx?.clearRect(0, 0, clientWidth, clientHeight);

    // this.parts.power.renderStatic(ctx!);
  }
}
