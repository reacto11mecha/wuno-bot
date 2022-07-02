import crypto from "crypto";
import { DateTime } from "luxon";

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

export const df = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "long" })
    .format(date)
    .replace(/\./g, ":");

export const getRandom = () => {
  const choice = [random(), Math.random()];

  return choice[Math.floor(Math.random() * choice.length)];
};

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

// Credit: https://www.geeksforgeeks.org/random-number-generator-in-arbitrary-probability-distribution-fashion/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function findCeil(arr, r, l, h) {
  let mid;

  while (l < h) {
    mid = l + ((h - l) >> 1);
    r > arr[mid] ? (l = mid + 1) : (h = mid);
  }

  return arr[l] >= r ? l : -1;
}

// Credit: https://www.geeksforgeeks.org/random-number-generator-in-arbitrary-probability-distribution-fashion/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function randomWithBias(arr, freq, n) {
  const prefix = [];

  prefix[0] = freq[0];

  for (let i = 1; i < n; ++i) prefix[i] = prefix[i - 1] + freq[i];

  const r = Math.floor(Math.random() * prefix[n - 1]) + 1;

  const indexc = findCeil(prefix, r, 0, n - 1);
  return arr[indexc];
}
