import fs from "fs";

const files = fs
  .readdirSync(new URL(".", import.meta.url))
  .filter((file) => file !== "index.js")
  .filter((file) => file.endsWith(".js"));

export default async function getControllers() {
  const controller = await Promise.all(
    files.map(async (file) => {
      const keyName = file.replace(".js", "");
      const calledFunction = await import(new URL(file, import.meta.url));

      if (calledFunction.default === undefined)
        throw new Error(`${keyName} is not a function`);

      return {
        [keyName]: calledFunction.default,
      };
    })
  );

  return controller.reduce((curr, acc) => Object.assign(curr, acc));
}
