import { prop, Ref } from "@typegoose/typegoose";

import { Game } from "./game";
import { Card } from "./card";

class GameProperty {
  @prop({ default: false })
  public isJoiningGame?: boolean;

  @prop({ ref: () => Game })
  public gameUID?: Ref<Game>;

  @prop()
  public gameID?: string;

  @prop({ ref: () => Card })
  public card?: Ref<Card>;
}

export class User {
  @prop({ _id: false })
  public gameProperty?: GameProperty;

  @prop({ required: true })
  public userName!: string;

  @prop({ required: true, unique: true })
  public phoneNumber!: string;

  @prop({ default: () => Date.now() })
  public created_at?: Date;
}
