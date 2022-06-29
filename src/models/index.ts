import { getModelForClass } from "@typegoose/typegoose";

import { User } from "./user";
import { Game, GameStatus } from "./game";
import { Card } from "./card";

export const UserModel = getModelForClass(User);
export const GameModel = getModelForClass(Game);
export const CardModel = getModelForClass(Card);
export { User, Game, Card, GameStatus };
