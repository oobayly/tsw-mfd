import { Coords, DomUtil, DoneCallback, GridLayer, Projection } from "leaflet";
import { OverpassJson } from "overpass-ts";

interface JsonMapValue {
  count: number;
  value: Promise<OverpassJson | undefined>;
}

export class StationLayer extends GridLayer {
  private readonly jsonMap = new Map<string, JsonMapValue>();

  constructor() {
    super({
      minZoom: 7,
      maxZoom: 18,
    });

    console.log(Projection.SphericalMercator.project({ lat: 0, lng: 0 }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as unknown as any).spherical = Projection.SphericalMercator;
  }

  protected override createTile({ z, x, y }: Coords, done: DoneCallback): HTMLElement {
    const canvas = DomUtil.create("canvas");
    const { x: width, y: heading } = this.getTileSize();

    canvas.width = width;
    canvas.height = heading;

    this.tryRenderTile(x, y, z, canvas).then(() => {
      done(undefined, canvas);
    })

    return canvas;
  }

  private async fetchTile(x: number, y: number, z: number): Promise<OverpassJson | undefined> {
    try {
      const resp = await fetch(`/json/${z}-${x}-${y}.json`);
      const json = await resp.json();

      return json as OverpassJson;
    } catch (e) {
      //console.log(e);
    }

    return undefined;
  }

  private getXyz(x: number, y: number, z: number): { x: number, y: number, z: number, key: string } {
    const dz = z - 9;

    if (dz > 0) {
      x >>= dz;
      y >>= dz;
      z -= dz;
    } else if (dz < 0) {
      x <<= dz;
      y <<= dz;
      z += dz;
    }

    return {
      x, y, z,
      key: `${z}-${x}-${y}`,
    };
  }

  private async getTile(x: number, y: number, z: number): Promise<OverpassJson | undefined> {
    const { key, x: nx, y: ny, z: nz } = this.getXyz(x, y, z);
    const found = this.jsonMap.get(key);

    if (found) {
      console.log("Using cached: ", x, y, z);
      found.count++;
      return await found.value;
    } else {
      console.log("Using new: ", x, y, z);
      const resp = this.fetchTile(nx, ny, nz);

      this.jsonMap.set(key, { count: 0, value: resp });

      return await resp;
    }
  }

  private completedTile(x: number, y: number, z: number): void {
    const { key } = this.getXyz(x, y, z);
    const found = this.jsonMap.get(key);

    console.log("Removing: ", x, y, z);

    if (!found) {
      return;
    }

    found.count--;

    if (!found.count) {
      this.jsonMap.delete(key);
    }
  }

  private renderTile(x: number, y: number, z: number, ctx: CanvasRenderingContext2D, elements: OverpassJson["elements"]): void {
    // Projection.SphericalMercator.project([])
    const worldSize = 256 * Math.pow(2, z);
    const originX = -20037508.34;
    const originY = 20037508.34;
    const worldExtent = 40075016.68;
    const scale = worldSize / worldExtent;
    const invScale = 1 / scale;

    ctx.resetTransform();
    ctx.translate(-x * 256, -y * 256); // First translate so 
    ctx.scale(scale, -scale);
    ctx.translate(20037508.34, -20037508.34);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#00008B";
    ctx.font = "bold 13px Arial";

    elements.forEach((e) => {
      if (e.type !== "node") {
        return;
      }

      const name = z < 11 ? e.tags?.["railway:ref"] : e.tags?.["name"];

      if (!name) {
        return;
      }

      const { lat, lon: lng } = e;
      const { x, y } = Projection.SphericalMercator.project({ lat, lng });

      const metrics = ctx.measureText(name);
      const { width: tw } = metrics;
      const th = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const tx = - tw / 2;
      const ty = - metrics.actualBoundingBoxDescent;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(invScale, -invScale);

      ctx.strokeText(name, tx, ty);
      ctx.fillText(name, tx, ty);

      ctx.restore();
    });
  }

  private async tryRenderTile(x: number, y: number, z: number, canvas: HTMLCanvasElement): Promise<void> {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // let data: OverpassJson | undefined;

    // try {
    //   data = await this.getTile(x, y, z);
    // } finally {
    //   this.completedTile(x, y, z);
    // }

    ctx.fillStyle = "black";
    ctx.fillText(`${z} / ${x} / ${y}`, 0, 16);

    // if (!data) {
    //   return;
    // }

    // ctx.resetTransform();
    // ctx.fillText(`${data.elements.length} nodes`, 0, 32);

    // this.renderTile(x, y, z, ctx, data.elements);
  }
}
