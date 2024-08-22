import { Alignment, Rectangle, Size } from "./interfaces";

export abstract class MfdPartBase<TOptions, TRenderOptions> {
  protected abstract readonly partBounds: Readonly<Rectangle>;

  constructor(
    public readonly options: Readonly<TOptions>,
    public readonly bounds: Readonly<Rectangle>,
  ) { }

  // ========================
  // Abstract methods
  // ========================

  protected abstract getScale(): number;

  protected abstract getSize(): Size;

  public abstract renderDynamic(ctx: CanvasRenderingContext2D, value: TRenderOptions): void;

  public abstract renderStatic(ctx: CanvasRenderingContext2D): void;

  // ========================
  // Methods
  // ========================

  public renderAll(ctx: CanvasRenderingContext2D, value: TRenderOptions): void {
    this.renderDynamic(ctx, value);
    this.renderStatic(ctx)
  }

  /** Scales and transforms the specified context. */
  protected scaleAndTransform(ctx: CanvasRenderingContext2D, cb: (ctx: CanvasRenderingContext2D) => void, origin: Alignment = Alignment.Centre): void {
    const scale = this.getScale();
    const { width, height } = this.getSize();

    ctx.save();
    ctx.translate(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2);
    ctx.scale(scale, scale);

    if (origin) {
      let dx = 0;
      let dy = 0;

      if (origin & Alignment.Left) {
        dx = -width / 2;
      } else if (origin & Alignment.Right) {
        dx = width / 2;
      }
      if (origin & Alignment.Top) {
        dy = -height / 2;
      } else if (origin & Alignment.Bottom) {
        dy = height / 2;
      }

      ctx.translate(dx, dy);
    }

    // This does the drawing
    cb(ctx);

    // Endure the transform is reset
    ctx.restore();
  }
}
