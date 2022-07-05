import { prop, Ref } from "@typegoose/typegoose";

import { cards, CardPicker } from "../config/cards";
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
    default: () => [...new Array(6)].map(() => CardPicker.pickRandomCard()),
  })
  public cards?: string[];
}
