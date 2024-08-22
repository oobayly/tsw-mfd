import { interval, map, Subscription, takeWhile } from "rxjs";

export const runSelfTestOverRange = (
  ms: number, initial: number, delta: number, targets: number[],
  tick: (value: number) => void,
  completed: () => void,
): Subscription => {
  targets = [...targets]; // Copy so don't alter the original array
  let value = initial;

  return interval(ms).pipe(
    takeWhile(() => !!targets.length),
    map(() => {
      const [tgt] = targets;

      value += delta;

      if ((delta > 0 && value >= tgt) || (delta < 0 && value <= tgt)) {
        targets.shift();
        value = tgt;
        delta *= -1;
      }

      return value;
    })
  ).subscribe({
    next: tick,
    complete: completed
  });
}
