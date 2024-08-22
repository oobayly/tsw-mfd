export interface LzbDistanceGroup {
  /** The distance interval. */
  dD: number;
  /** The number of intervals. */
  c: number;
  /** The optional line width. */
  w?: number;
  /** The optional font size (px). */
  fs?: number
  /** The number of times the group is repeated. */
  rep?: number;
}

/** Get the number of ticks for the specified distance groups. */
export const getDistanceTicks = (items: LzbDistanceGroup[]): number => items.reduce((sum, x) => sum + (x.c * (x.rep ?? 1)), 0);
