/// <reference types="leaflet" />

declare module "@maptiler/leaflet-maptilersdk" {
  export class MaptilerLayer extends L.Layer {
    constructor(options?: MaptilerLayerOptions);
  }

  interface MaptilerLayerOptions extends L.LayerOptions {
    apiKey: string;
    interactive?: boolean;
    padding?: number;
    style?: string;
    updateInterval?: number;
  }
}
