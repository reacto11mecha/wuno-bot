import { prop, Ref } from "@typegoose/typegoose";

import { Game } from "./game";
import { Card } from "./card";

/**
 * Game property of the user
 */
export class GameProperty {
  /**
   * Is user joining a game session
   */
  @prop({ default: false })
  public isJoiningGame?: boolean;

  /**
   * Game _id property
   */
  @prop({ ref: () => Game })
  public gameUID?: Ref<Game>;

  /**
   * Game gameID property
   */
  @prop()
  public gameID?: string;

  /**
   * Card _id property
   */
  @prop({ ref: () => Card })
  public card?: Ref<Card>;
}

/**
 * Model skeleton for handling user information
 */
export class User {
  /**
   * Game property of the user
   */
  @prop({ _id: false })
  public gameProperty?: GameProperty;

  /**
   * Username of an user
   */
  @prop({ required: true })
  public userName!: string;

  /**
   * Phonenumber of an user
   */
  @prop({ required: true, unique: true })
  public phoneNumber!: string;

  /**
   * When is the user registered
   */
  @prop({ default: () => Date.now() })
  public created_at?: Date;
}
