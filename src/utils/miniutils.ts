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
 * Get biased random value beetween Math.random or webcrypto getRandomValues
 * @returns Random number value
 */
export const getRandom = () => {
  const choice = [random(), Math.random()];

  return choice[Math.floor(Math.random() * choice.length)];
};

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
 * Find ceiling from array
 *
 * Credit: https://www.geeksforgeeks.org/random-number-generator-in-arbitrary-probability-distribution-fashion/
 */
function findCeil(arr: number[], r: number, l: number, h: number): number {
  let mid: number;

  while (l < h) {
    mid = l + ((h - l) >> 1);
    r > arr[mid] ? (l = mid + 1) : (h = mid);
  }

  return arr[l] >= r ? l : -1;
}

/**
 * Get random value with certain bias
 *
 * Credit: https://www.geeksforgeeks.org/random-number-generator-in-arbitrary-probability-distribution-fashion/
 */
export function randomWithBias<T>(arr: T[], freq: number[], n: number): T {
  const prefix: number[] = [];
  prefix[0] = freq[0];

  for (let i = 1; i < n; ++i) {
    prefix[i] = prefix[i - 1] + freq[i];
  }

  const random = Math.floor(Math.random() * prefix[n - 1]) + 1;

  const indexc = findCeil(prefix, random, 0, n - 1);
  return arr[indexc];
}
