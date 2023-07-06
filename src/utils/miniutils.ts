import crypto from "crypto";
import { DateTime, Duration } from "luxon";

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

const getHumanReadable = (time: string) => {
  const [hours, minutes, seconds] = time.split(":");

  let humanReadableFormat = "";

  if (parseInt(hours) > 0) {
    humanReadableFormat += `${hours} jam `;
  }

  if (parseInt(minutes) > 0) {
    humanReadableFormat += `${minutes} menit `;
  }

  if (parseInt(seconds) > 0) {
    humanReadableFormat += `${seconds} detik`;
  }

  return humanReadableFormat.trim();
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

  const diff = luxonEnd.diff(luxonStart);

  const decidedString = diff.toFormat("H':'mm':'ss");

  return getHumanReadable(decidedString);
};

/**
 * Util for formatting human readable duration
 * @param duration Duration in milisecond
 * @returns Human readable duration
 */
export const calcDuration = (duration: number) => {
  const luxonDuration = Duration.fromMillis(duration);

  const decidedString = luxonDuration.toFormat("H':'mm':'ss");

  return getHumanReadable(decidedString);
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
