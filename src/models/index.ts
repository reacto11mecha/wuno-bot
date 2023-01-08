import { getModelForClass } from "@typegoose/typegoose";

import { User, GameProperty } from "./user";
import { Game, GameStatus } from "./game";
import { Card } from "./card";

/**
 * Model instance from User class
 */
export const UserModel = getModelForClass(User);

/**
 * Model instance from Game class
 */
export const GameModel = getModelForClass(Game);

/**
 * Model instance from Card class
 */
export const CardModel = getModelForClass(Card);

export { User, Game, Card, GameStatus, GameProperty };
