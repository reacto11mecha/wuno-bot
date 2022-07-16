import { prop, Ref } from "@typegoose/typegoose";

import { cards } from "../config/cards";
import { User } from "./user";
import { Game } from "./game";

/**
 * Model skeleton for handling user card information
 */
export class Card {
  /**
   * User specific _id
   */
  @prop({ ref: () => User })
  public user?: Ref<User>;

  /**
   * Game specific _id
   */
  @prop({ ref: () => Game })
  public game?: Ref<Game>;

  /**
   * Stored user cards
   */
  @prop({
    type: () => [String],
    validate: (cardsInput: string[]) =>
      cardsInput.every((card) => (cards as string[]).includes(card)),
  })
  public cards?: string[];
}
