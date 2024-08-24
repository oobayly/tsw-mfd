import { Observable, Subscription } from "rxjs";
import { MfdPartBase } from "../MfdPartBase";
import { DialConfig, DialValue, Rectangle, Size } from "../interfaces";
import { runSelfTestOverRange } from "../self-test";

interface DbSemiDigitalDialOptions extends DialConfig {
  /** The overall size of the dial. */
  size: number;
  /** The radius from which the ticks are measured. */
  radius: number;
  /** The units text. */
  units: string;
  /** A flag indicating whether the dial has a limit display. */
  hasLimit?: true;
}

/** Represents a dial as used by the DB ICE3. */
export class DbSemiDigitalDial extends MfdPartBase<DbSemiDigitalDialOptions, DialValue> {
  protected override readonly partBounds: Rectangle;

  constructor(
    options: DbSemiDigitalDialOptions,
    bounds: Readonly<Rectangle>,
  ) {
    super(options, bounds);

    this.partBounds = { x: 0, y: 0, width: options.radius, height: options.radius };
  }

  protected override getScale(): number {
    const { size } = this.options;
    const { width, height } = this.bounds;

    return Math.min(width / size, height / size);
  }

  protected override getSize(): Size {
    const { size } = this.options;

    return { width: size, height: size };
  }

  public override renderDynamic(ctx: CanvasRenderingContext2D, { value, target, limit }: DialValue): void {
    this.scaleAndTransform(ctx, (ctx) => {
      const { radius, hasLimit, size } = this.options;
      const { angle: angle0, value: value0 } = this.options.limits[0];
      const { angle: angle1, value: value1 } = this.options.limits[1];
      const dAdU = (angle1 - angle0) / (value1 - value0);

      // Needle
      value ??= 0;
      ctx.strokeStyle = "#878b86";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.save();
      ctx.rotate(angle0 + (value - value0) * dAdU);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();
      ctx.restore();

      // Hub
      ctx.fillStyle = "#1b1c1b";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Target 
      if (target != null) {
        ctx.fillStyle = "#a52b38ff";
        ctx.save();
        ctx.rotate(angle0 + (target - value0) * dAdU);
        ctx.beginPath();
        ctx.ellipse(radius + 7.5, 0, 5, 3, 0, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.restore();
      }

      // Limit 
      if (hasLimit && limit != null) {
        // Draw the limit LED digits
        ctx.fillStyle = "#d4ec4d";
        ctx.font = "22px SevenSeg";

        const y = (size / 2) * 2 / 3; // 2/3 of the radius of the dial
        const text = limit.toFixed(0).padStart(3, "0");
        const metrics = ctx.measureText(text);
        const width = metrics.width;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        ctx.fillText(text, -width / 2, y + height / 2,);
      }
    });
  }

  public override renderStatic(ctx: CanvasRenderingContext2D): void {
    this.scaleAndTransform(ctx, (ctx) => {
      const { ticks: pips, radius, size, units, hasLimit } = this.options;
      const { angle: angle0, value: value0 } = this.options.limits[0];
      const { angle: angle1, value: value1 } = this.options.limits[1];
      const dAdU = (angle1 - angle0) / (value1 - value0);

      // The inset dial
      ctx.fillStyle = "#0c0d0c";
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI, true);
      ctx.fill();

      // Dial pips
      ctx.strokeStyle = "#c3ea9d";
      ctx.font = "12px Arial";
      pips.forEach((pip) => {
        const { interval, text } = pip;
        const [x0, x1] = pip.ends;
        ctx.save();
        ctx.rotate(angle0);

        ctx.lineWidth = pip.thickness;
        ctx.lineCap = "round";

        for (let v = value0; v <= value1; v += interval) {
          ctx.beginPath();
          ctx.moveTo(radius + x0, 0);
          ctx.lineTo(radius + x1, 0);
          ctx.stroke();

          if (text) {
            const valueText = text === true ? `${v}` : text(v);
            const metrics = ctx.measureText(valueText);

            ctx.save();
            ctx.translate(radius + x0 - (x1 - x0), 0);
            ctx.rotate(-angle0 - dAdU * (v - value0));
            ctx.fillStyle = "#c3ea9d";
            ctx.fillText(valueText,
              -metrics.width / 2,
              (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2
            );

            ctx.restore();
          }

          ctx.rotate(dAdU * interval);
        }

        ctx.restore();
      });

      // Units text
      {
        const metrics = ctx.measureText(units);
        const y = (size / 2) / 3; // 1/3 of the radius of the dial

        ctx.fillStyle = "#c3ea9d";
        ctx.fillText(units,
          -metrics.width / 2,
          y + (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2
        );
      }

      // Limit
      if (hasLimit) {
        ctx.fillStyle = "black";
        ctx.font = "22px SevenSeg";

        const y = (size / 2) * 2 / 3; // 2/3 of the radius of the dial
        const metrics = ctx.measureText("000");
        const width = metrics.width + 2 * 5;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 2 * 5;

        ctx.beginPath();
        ctx.roundRect(-width / 2, y - height / 2, width, height);
        ctx.fill();
      }
    });
  }

  public runSelfTest(duration: number, delta: number = 1): Observable<number> {
    return runSelfTestOverRange(duration, delta, [0, this.options.limits[1].value, this.options.limits[0].value, 0]);
  }
}
