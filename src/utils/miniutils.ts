import crypto from "crypto";

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
