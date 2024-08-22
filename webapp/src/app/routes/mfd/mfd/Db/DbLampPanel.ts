import { delay, first, interval, map, Subscription, takeWhile, timeout, timer } from "rxjs";
import { MfdPartBase } from "../MfdPartBase";
import { Alignment, Point, Rectangle, Size } from "../interfaces";
import { DbLampColourNames, DbLampColours, DbLampNames, DbLamps, getDbLampColour } from "./DbLamps";
import { setThrowInvalidWriteToSignalError } from "@angular/core/primitives/signals";

interface LampOptions {
  /** The radius of each lamp. */
  radius: 18;
  /** The list of lamps names. */
  lamps: DbLampNames[][];
  /** The space between lamps. */
  spacing: Point;
}

export class DbLampPanel extends MfdPartBase<LampOptions, DbLampNames[]> {
  protected override partBounds: Readonly<Rectangle>;

  constructor(
    options: Readonly<LampOptions>,
    bounds: Readonly<Rectangle>
  ) {
    super(options, bounds);

    const { radius, lamps } = options;
    const { x: dx, y: dy } = options.spacing;
    const columns = lamps.reduce((accum, item) => {
      if (item.length > accum) {
        accum = item.length;
      }

      return accum;
    }, -1);
    const rows = lamps.length;

    const width = columns * radius * 2 + (columns - 1) * dx;
    const height = rows * radius * 2 + (rows - 1) * dy;

    this.partBounds = { x: 0, y: 0, width, height };
  }

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

  public override renderDynamic(ctx: CanvasRenderingContext2D, value: DbLampNames[]): void {
    this.scaleAndTransform(ctx, (ctx) => {
      const { radius } = this.options;
      const { x: px, y: py } = this.partBounds;
      const { x: dx, y: dy } = this.options.spacing;

      // Lamp path
      const circle = new Path2D();
      circle.arc(0, 0, radius, 0, 2 * Math.PI);

      // Buttons have a black border
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;

      this.options.lamps.forEach((row, j) => {
        const cy = py + radius + (j * (2 * radius + dy));

        row.forEach((lampName, i) => {
          const cx = px + radius + (+ i * (2 * radius + dx));

          const lamp = DbLamps[lampName] ?? DbLamps.blank;
          const isLit = lampName !== "blank" && value.includes(lampName);
          const bgName = "bg" in lamp ? lamp.bg : "default";

          ctx.save();
          ctx.translate(cx, cy);

          // Lamp fill
          ctx.fillStyle = getDbLampColour(bgName, isLit);
          ctx.fill(circle);

          // Lamp label content
          if (lamp.c) {
            lamp.c.forEach((content) => {
              const fgName = "fg" in content ? content.fg : undefined;

              ctx.fillStyle = getDbLampColour(fgName ?? "default-fg", isLit);

              if ("p" in content) {
                // SVG Path
                ctx.fill(new Path2D(content.p));
              } else if ("t" in content) {
                // Font size
                const fs = "fs" in content ? content.fs : undefined;

                // Measure the text for the specified font
                ctx.font = `${fs ?? 16}px Arial`;
                const metrics = ctx.measureText(content.t);

                ctx.fillText(content.t,
                  -metrics.width / 2,
                  (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2
                );
              }
            })
          }

          // Border
          ctx.stroke(circle);

          ctx.restore();
        });
      })

    }, Alignment.Top | Alignment.Left);
  }

  public override renderStatic(ctx: CanvasRenderingContext2D): void {
  }

  public runSelfTest(ms: number, tick: (v: DbLampNames[]) => void, completed: () => void): Subscription {
    const allLamps = this.options.lamps
      .reduce((accum, lamps) => {
        accum.push(...lamps);

        return accum;
      }, [])
      .filter((x): x is DbLampNames => x !== "blank")
      ;

    tick(allLamps);

    return interval(ms).pipe(
      first(),
    ).subscribe(completed);
  }
}
