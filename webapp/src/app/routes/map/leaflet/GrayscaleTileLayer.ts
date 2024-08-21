/*
 * L.TileLayer.Grayscale is a regular tilelayer with grayscale makeover.
 */

import { Coords, DoneCallback, tileLayer, TileLayer, TileLayerOptions } from "leaflet";

export class GrayscaleTileLayer extends TileLayer {
  private readonly quotaRed = 21;
  private readonly quotaGreen = 71;
  private readonly quotaBlue = 8;
  private readonly quotaDividerTune = 0;

  private get quotaDivider(): number {
    return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
  }

  constructor(urlTemplate: string, options: TileLayerOptions) {
    options.crossOrigin = true;

    super(urlTemplate, options);

    this.on("tileload", (e) => {
      this.makeGrayscale(e.tile);
    });
  }

  // override createTile(coords: Coords, done: DoneCallback): HTMLElement {
  //   const tile = super.createTile(coords, done);
  //   (tile as HTMLImageElement).crossOrigin = "Anonymous";

  //   return tile;
  // }

  private makeGrayscale(img: HTMLImageElement): void {
    if (img.dataset["grayscaled"]) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.filter = "grayscale(1)";
    ctx.drawImage(img, 0, 0);
    img.crossOrigin = '';

    // const imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // const pix = imgd.data;
    // const { quotaRed, quotaGreen, quotaBlue, quotaDivider } = this;

    // for (var i = 0, n = pix.length; i < n; i += 4) {
    //   pix[i] = pix[i + 1] = pix[i + 2] = (quotaRed * pix[i] + quotaGreen * pix[i + 1] + quotaBlue * pix[i + 2]) / quotaDivider;
    // }

    // ctx.putImageData(imgd, 0, 0);

    img.dataset["grayscaled"] = `${true}`;
    img.src = canvas.toDataURL();
  }
}
