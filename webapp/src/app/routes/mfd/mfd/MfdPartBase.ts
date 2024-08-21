import { Rectangle, Size } from "./interfaces";

export abstract class MfdPartBase<TOptions, TRenderOptions>  {
  protected abstract readonly partBounds: Rectangle;

  constructor(
    protected readonly options: Readonly<TOptions>,
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

  public render(ctx: CanvasRenderingContext2D, value: TRenderOptions): void {
    this.renderDynamic(ctx, value);
    this.renderStatic(ctx)
  }

  /**
   * Scales and transforms the specified context.
   * @summary Ensure to restore the context after this has been called.
   */
  protected scaleAndTransform(ctx: CanvasRenderingContext2D, origin: "top-left" | "centre"): void {
    const scale = this.getScale();
    const { width, height } = this.getSize();

    ctx.save();
    ctx.translate(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.height / 2);
    ctx.scale(scale, scale);

    switch (origin) {
      case "centre":
        // ctx.translate(-width / 2, -height / 2);
        break;
    }

  }
}
