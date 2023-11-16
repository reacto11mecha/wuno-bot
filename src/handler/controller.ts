import fs from "fs";
import path from "path";

let dirPath = path.join(__dirname, "..", "controller");

// This is for compiled file in production mode
if (!fs.existsSync(dirPath)) {
  dirPath = path.join(__dirname, "controller");
}

const files = fs
  .readdirSync(dirPath)
  .filter((file) => file.endsWith(".js") || !file.includes(".d.ts"))
  .filter((file) => !file.endsWith(".map"));

/**
 * Lists of all controller name
 */
export const controllerName = files.map((file) =>
  file.replace(".js", "").replace(".ts", ""),
);

/**
 * Function that call all of the controller from controller directory
 * @returns List of all controllers object
 */
export async function getController() {
  const controller = await Promise.all(
    files.map(async (file) => {
      const keyName = file.replace(".js", "").replace(".ts", "");
      const calledFunction = await import(path.join(dirPath, file));

      if (calledFunction.default === undefined)
        throw new Error(`${keyName} is not a function`);

      return {
        [keyName]: calledFunction.default,
      };
    }),
  );

  return controller.reduce((curr, acc) => Object.assign(curr, acc));
}
