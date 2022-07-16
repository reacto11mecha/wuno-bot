import { prop, plugin, Ref } from "@typegoose/typegoose";
import autopopulate from "mongoose-autopopulate";
import { nanoid } from "nanoid";

import { User } from "./user";

import { CardPicker } from "../config/cards";

/**
 * Enum that can indicate game status
 */
export enum GameStatus {
  WAITING = "WAITING",
  PLAYING = "PLAYING",
  ENDED = "ENDED",
}

/**
 * Model skeleton for handling user game information
 */
@plugin(autopopulate)
export class Game {
  /**
   * Human readable game identifier
   */
  @prop({ maxLength: 11, unique: true, default: () => nanoid(11) })
  public gameID?: string;

  /**
   * The status of the game indicator
   */
  @prop({ enum: GameStatus, default: GameStatus.WAITING })
  public status?: GameStatus;

  /**
   * Stored game creator identity
   */
  @prop({ ref: () => User })
  public gameCreatorID?: Ref<User>;

  /**
   * When is the game session started
   */
  @prop()
  public startTime?: Date;

  /**
   * When is the game session ended
   */
  @prop()
  public endTime?: Date;

  /**
   * Stored information about current card
   */
  @prop({ default: () => CardPicker.getInitialCard() })
  public currentCard?: string;

  /**
   * Stored information about current player position
   */
  @prop({ ref: () => User })
  public currentPosition: Ref<User>;

  /**
   * What are the players' order
   */
  @prop({ ref: () => User })
  public playersOrder?: Ref<User>[];

  /**
   * Lists of all players
   */
  @prop({ autopopulate: true, ref: () => User })
  public players?: Ref<User>[];

  /**
   * When is the game session created
   */
  @prop({ default: () => Date.now() })
  public created_at?: Date;
}
