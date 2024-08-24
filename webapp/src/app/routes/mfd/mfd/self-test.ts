import { interval, map, Observable, Subscription, takeWhile } from "rxjs";

export const runSelfTestOverRange = (
  duration: number, delta: number, targets: number[],
  // tick: (value: number) => void,
  // completed: () => void,
): Observable<number> => {
  if (targets.length < 2) {
    throw new Error("At least two target value are required.");
  }

  targets = [...targets]; // Copy so don't alter the original array

  // Total number of steps
  const steps = targets.reduce((accum, current, index, arr) => {
    if (index > 0) {
      accum += Math.abs(Math.round(current - arr[index - 1]) / delta);
    }

    return accum;
  }, 0);
  const ms = 1000 * duration / steps;

  console.log(targets, steps, delta, ms);

  let value = targets.shift()!;

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
  );
}
