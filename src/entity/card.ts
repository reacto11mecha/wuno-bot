import { Entity, ObjectID, ObjectIdColumn, Column, ManyToOne } from "typeorm";
import type { allCard } from "../config/cards";

import { User } from "./user";
import { Game } from "./game";

@Entity()
export class Card {
  @ObjectIdColumn()
  id: ObjectID;

  @ManyToOne(() => User, (user) => user.id)
  user_id: ObjectID;

  @ManyToOne(() => Game, (game) => game.id)
  game_id: ObjectID;

  @Column()
  cards: allCard[];
}
