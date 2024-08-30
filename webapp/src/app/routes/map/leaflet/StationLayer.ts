import { Coords, DomUtil, DoneCallback, GridLayer } from "leaflet";

export class StationLayer extends GridLayer {
  constructor() {
    super({
      minZoom: 7,
      maxZoom: 18,
    })
  }

  protected override createTile({ z, x, y }: Coords, done: DoneCallback): HTMLElement {
    const canvas = DomUtil.create("canvas");
    const { x: width, y: heading } = this.getTileSize();

    canvas.width = width;
    canvas.height = heading;
    //canvas.style.visibility = "initial";

    window.setTimeout(() => {
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(`${z} / ${x} / ${y}`, 0, 16);
      }

      done(undefined, canvas);
    }, 1000 * Math.random());

    return canvas;
  }
}
