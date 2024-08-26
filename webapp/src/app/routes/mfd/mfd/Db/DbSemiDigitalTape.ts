import { Observable } from "rxjs";
import { Alignment, Rectangle, Size } from "../interfaces";
import { MfdPartBase } from "../MfdPartBase";
import { runSelfTestOverRange } from "../self-test";
import { getDistanceTicks, LzbDistanceGroup } from "./Lzb";

/** Represents a distance tape as used on the DB ICE3 */
export class DbSemiDigitalTape extends MfdPartBase<null, number | undefined> {
  protected override partBounds: Readonly<Rectangle> = { x: 0, y: 0, width: 72, height: 233 };

  private readonly distanceBounds: Readonly<Rectangle> = { x: 0, y: 39, width: 18, height: 194 };
  private readonly numbersBounds: Readonly<Rectangle> = { x: 0, y: 0, width: 72, height: 28 };
  private readonly tickBounds: Readonly<Rectangle> = { x: 22, y: 45, width: 45, height: 183 };

  private readonly distances: LzbDistanceGroup[] = [
    { dD: 0, c: 1 },
    { dD: 25, c: 4, w: 3, fs: 8 },
    { dD: 50, c: 3, w: 8 },
    { dD: 50, c: 5, rep: 3, w: 8 },
    { dD: 200, c: 5, rep: 3, w: 17 },
  ] satisfies LzbDistanceGroup[];

  private readonly tickCount = getDistanceTicks(this.distances);
  private readonly pxPerTick = this.tickBounds.height / (this.tickCount - 1);

  protected override getScale(): number {
    const { width, height } = this.bounds;
    const { width: pw, height: ph } = this.partBounds;

    return Math.min(width / pw, height / ph);
  }

  protected override getSize(): Size {
    return {
      width: this.partBounds.width,
      height: this.partBounds.height,
    };
  }

  public override renderDynamic(ctx: CanvasRenderingContext2D, value: number | undefined): void {
    if (!value) {
      return;
    }

    const rounded = Math.min(Math.floor(value / 100) * 100, 9900);

    this.scaleAndTransform(ctx, (ctx) => {
      // Draw the distance
      ctx.fillStyle = "#d4ec4d";
      ctx.font = "22px SevenSeg";

      const { x: bx, y: by, width: bw, height: bh } = this.numbersBounds;
      const text = `${rounded}`.padStart(4, "0");
      const metrics = ctx.measureText(text);

      ctx.fillText(text,
        bx + (bw - metrics.width) / 2,
        by + (bh + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2,
      );

      // Ticks
      const { pxPerTick } = this;
      const { y: ty, height: th } = this.tickBounds;
      const { x: dx, width: dw } = this.distanceBounds;
      const x0 = dx + 4;
      const x1 = dx + dw - 4;
      let y = ty + th;
      let distance = 0;
      const active = new Path2D();

      this.distances.forEach(({ dD, c, rep }) => {
        // Repeats are optional
        rep ??= 1;

        for (let j = 0; j < rep; j++) {
          // Repeat each of the sets r-times
          for (let i = 0; i < c; i++) {
            // Increment the distance first
            if (dD) {
              distance += dD;
            }

            if (distance <= value) {
              active.moveTo(x0, y);
              active.lineTo(x1, y);
            }

            y -= pxPerTick;
          }
        }
      });

      // Active distance
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#c3ea9d";
      ctx.stroke(active);

    }, Alignment.Top | Alignment.Left);
  }

  public override renderStatic(ctx: CanvasRenderingContext2D): void {
    this.scaleAndTransform(ctx, (ctx) => {
      // LED Insets
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.roundRect(this.distanceBounds.x, this.distanceBounds.y, this.distanceBounds.width, this.distanceBounds.height, 2);
      ctx.roundRect(this.numbersBounds.x, this.numbersBounds.y, this.numbersBounds.width, this.numbersBounds.height, 2);
      ctx.fill();

      {
        const { pxPerTick } = this;
        const { x: tx, y: ty, width: tw, height: th } = this.tickBounds;
        let y = ty + th;
        let distance = 0;
        const minor = new Path2D();
        const major = new Path2D();

        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";

        this.distances.forEach(({ dD, c, rep, w, fs }) => {
          // Repeats are optional
          rep ??= 1;

          ctx.font = `${fs ?? 10}px Arial`;

          for (let j = 0; j < rep; j++) {
            // Repeat each of the sets r-times
            for (let i = 0; i < c; i++) {
              // Increment the distance first
              if (dD) {
                distance += dD;
              }

              // Draw each pip c-times
              if (i === (c - 1)) {
                // Major tick includes text
                major.moveTo(tx, y);
                major.lineTo(tx + tw, y);

                const text = `${distance}`;
                const metrics = ctx.measureText(text);

                ctx.fillText(text, tx + tw - metrics.width, y - 2);
              } else if (w) {
                // Minor tick
                minor.moveTo(tx, y);
                minor.lineTo(tx + w, y);
              }

              y -= pxPerTick;
            }
          }
        });

        // Minor pips
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke(minor);

        // Major pips
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke(major);
      }

    }, Alignment.Top | Alignment.Left);
  }

  public runSelfTest(duration: number): Observable<number> {
    return runSelfTestOverRange(duration, -50, [9900, 0]);
  }
}
