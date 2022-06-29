import { prop, plugin, Ref } from "@typegoose/typegoose";
import autopopulate from "mongoose-autopopulate";
import { nanoid } from "nanoid";

import { User } from "./user";
import { random } from "../utils";

import { cards } from "../config/cards";
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const getInitialCard = () =>
  appropriateInitialCards[
    Math.floor(random() * appropriateInitialCards.length)
  ];

export enum GameStatus {
  WAITING = "WAITING",
  PLAYING = "PLAYING",
  ENDED = "ENDED",
}

@plugin(autopopulate)
export class Game {
  @prop({ maxLength: 11, unique: true, default: () => nanoid(11) })
  public gameID?: string;

  @prop({ enum: GameStatus, default: GameStatus.WAITING })
  public status?: GameStatus;

  @prop({ ref: () => User })
  public gameCreatorID?: Ref<User>;

  @prop()
  public startTime?: Date;

  @prop()
  public endTime?: Date;

  @prop({ default: () => getInitialCard() })
  public currentCard?: string;

  @prop({ ref: () => User })
  public currentPosition: Ref<User>;

  @prop({ ref: () => User })
  public playersOrder?: Ref<User>[];

  @prop({ autopopulate: true, ref: () => User })
  public players?: Ref<User>[];

  @prop({ default: () => Date.now() })
  public created_at?: Date;
}
