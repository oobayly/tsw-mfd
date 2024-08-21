
export interface DialConfig {
  limits: [DialLimit, DialLimit],
  pips: DialMarker[];
}

export interface DialLimit {
  value: number;
  /** The angle in radians. */
  angle: number;
}

export interface DialMarker {
  interval: number;
  width: number;
  ends: [number, number];
  text?: boolean
}

export interface DialValue {
  value?: number;
  target?: number;
  preselect?: number;
  limit?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Rectangle = Point & Size;
