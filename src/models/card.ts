import { prop, Ref } from "@typegoose/typegoose";

import { User } from "./user";
import { Game } from "./game";

export class Card {
  @prop({ ref: () => User })
  public user?: Ref<User>;

  @prop({ ref: () => Game })
  public game?: Ref<Game>;

  @prop({ type: () => [String] })
  public cards?: string[];
}
