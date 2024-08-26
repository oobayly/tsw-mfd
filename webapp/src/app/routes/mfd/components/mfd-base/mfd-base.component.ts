import { AfterViewInit, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { MfdControlsService } from "../../../../core/services/mfd-controls.service";
import { Size } from "../../mfd/interfaces";

@Component({
  selector: "app-mfd-base",
  standalone: true,
  imports: [],
  template: "",
})
export abstract class MfdBaseComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly mfdService = inject(MfdControlsService);

  protected abstract mfdName: string;

  protected abstract size: Size;

  private animationFrameId?: number;

  protected readonly subscriptions: Subscription[] = [];

  constructor(
  ) {
    window.addEventListener("resize", this.onResize);
  }

  ngAfterViewInit(): void {
    this.afterViewInit?.();
    this.onResize();
    this.nextFrame();

    window.setTimeout(() => {
      this.mfdService.mfd$.next({
        name: this.mfdName,
        hasSelfTest: !!this.selfTest,
      });
    });

    this.subscriptions.push(this.mfdService.selfTest$.subscribe(() => {
      if (this.selfTest) {
        this.selfTest();
      }
    }));
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener("resize", this.onResize);

    while (this.subscriptions.length) {
      this.subscriptions.pop()?.unsubscribe();
    }

    this.mfdService.mfd$.next(undefined);

    this.onDestroy?.();
  }

  ngOnInit(): void {
    this.onInit?.();
  }

  protected abstract animate(ts: number): void;

  protected abstract resized(): void;

  protected afterViewInit?(): void;

  protected onDestroy?(): void;

  protected onInit?(): void;

  protected selfTest?(): void;

  // ========================
  // Methods
  // ========================

  private nextFrame(): void {
    this.animationFrameId = window.requestAnimationFrame((ts) => {
      this.animate(ts);
      this.nextFrame();
    })
  }

  protected renderOnCanvas(canvas: HTMLCanvasElement, cb: (ctx: CanvasRenderingContext2D) => void): void {
    const { width, height } = canvas;
    const { width: pw, height: ph } = this.size;
    const scale = Math.min(width / pw, height / ph);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Ensure the canvas has been cleared
    ctx.clearRect(0, 0, width, height);

    // Transform so the component will be rendered as large as possible
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-pw / 2, -ph / 2);

    // This does the drawing
    cb(ctx);

    // Endure the transform is reset
    ctx.restore();
  }

  // ========================
  // Event handlers
  // ========================

  private onResize = (): void => {
    this.resized();
  }
}
