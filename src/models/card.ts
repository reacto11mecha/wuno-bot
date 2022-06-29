import { prop, Ref } from "@typegoose/typegoose";

import { cards } from "../config/cards";
import { Card as CardLib } from "../lib";
import { User } from "./user";
import { Game } from "./game";

export class Card {
  @prop({ ref: () => User })
  public user?: Ref<User>;

  @prop({ ref: () => Game })
  public game?: Ref<Game>;

  @prop({
    type: () => [String],
    validate: (cardsInput: string[]) =>
      cardsInput.every((card) => (cards as string[]).includes(card)),
    default: () => [...new Array(6)].map(() => CardLib.pickRandomCard()),
  })
  public cards?: string[];
}
