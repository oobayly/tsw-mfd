export enum Alignment {
  Centre = 0,
  Top = 0x1,
  Bottom = 0x2,
  Left = 0x4,
  Right = 0x8,
}

export interface DialConfig {
  /** The limits of the dial, min and max respectively. */
  limits: [DialLimit, DialLimit],
  /** The dial graduations */
  ticks: DialTick[];
}

export interface DialLimit {
  /** The value. */
  value: number;
  /** The angle in radians. */
  angle: number;
}

export interface DialTick {
  /** The interval. */
  interval: number;
  /** The line thickness. */
  thickness: number;
  /** The inner and outer limits of the tick. */
  ends: [number, number];
  /** A flag indicating whether the text should be drawn, or a callback */
  text?: true | ((value: number) => string);
}

export interface DialValue {
  /** The current value. */
  value?: number;
  /** The target value. */
  target?: number;
  /** The preselected value. */
  preselect?: number;
  /** The limit value. */
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
