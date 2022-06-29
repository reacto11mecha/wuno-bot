export type color = "red" | "green" | "blue" | "yellow";
export type possibleNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type allCard =
  | `${color}${possibleNumber}`
  | `wild${color}`
  | `wilddraw4${color}`
  | `${color}reverse`
  | `${color}skip`
  | `${color}draw2`
  | "wild"
  | "wilddraw4";

export const cards: allCard[] = [
  "red0",
  "red1",
  "red2",
  "red3",
  "red4",
  "red5",
  "red6",
  "red7",
  "red8",
  "red9",
  "wildred",
  "wilddraw4red",

  "green0",
  "green1",
  "green2",
  "green3",
  "green4",
  "green5",
  "green6",
  "green7",
  "green8",
  "green9",
  "wildgreen",
  "wilddraw4green",

  "blue0",
  "blue1",
  "blue2",
  "blue3",
  "blue4",
  "blue5",
  "blue6",
  "blue7",
  "blue8",
  "blue9",
  "wildblue",
  "wilddraw4blue",

  "yellow0",
  "yellow1",
  "yellow2",
  "yellow3",
  "yellow4",
  "yellow5",
  "yellow6",
  "yellow7",
  "yellow8",
  "yellow9",
  "wildyellow",
  "wilddraw4yellow",

  // Lucky system
  "wild",

  "redreverse",
  "redskip",
  "reddraw2",

  "greenreverse",
  "greenskip",
  "greendraw2",

  "bluereverse",
  "blueskip",
  "bluedraw2",

  "yellowreverse",
  "yellowskip",
  "yellowdraw2",

  "wilddraw4",
];
