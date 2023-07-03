import crypto from "crypto";
import { DateTime } from "luxon";

/**
 * Random number value generator that generated form webcrypto
 * @returns Random number value
 */
export const random = () => {
  return (
    (
      crypto.webcrypto as unknown as {
        getRandomValues: (input: Uint32Array) => number[];
      }
    ).getRandomValues(new Uint32Array(1))[0] /
    2 ** 32
  );
};

/**
 * Util for formatting JS date object to human readable date
 * @param date JS Date Object that will formatted
 * @returns Human readable date string
 */
export const df = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "long" })
    .format(date)
    .replace(/\./g, ":");

/**
 * Util for calculating elapsed time from the given start time to the end time and format it to human readable time
 * @param start Start time js date object
 * @param end End time js date object
 * @returns Human readable time
 */
export const calcElapsedTime = (start: Date, end: Date) => {
  const luxonStart = DateTime.fromJSDate(start);
  const luxonEnd = DateTime.fromJSDate(end);

  const diffHours = luxonEnd.diff(luxonStart, "hours").hours;
  const diff = luxonEnd.diff(luxonStart);

  const decidedString = diff.toFormat(`${diffHours >= 1 ? "hh: " : ""}mm, ss.`);

  return decidedString
    .replace(":", " jam")
    .replace(",", " menit")
    .replace(".", " detik");
};

/**
 * Get a weighted value from array
 */
export function weightedRandom<T>(values: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random < 0) {
      return values[i];
    }
  }

  return values[0];
}
