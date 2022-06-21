import { Entity, ObjectID, ObjectIdColumn, Column, ManyToOne } from "typeorm";
import { cards, type allCard } from "../config/cards";

import { User } from "./user";
import { Game } from "./game";

@Entity()
export class Card {
  @ObjectIdColumn({ primary: true })
  id: ObjectID;

  @ManyToOne(() => User, (user) => user.id)
  user_id: User;

  @ManyToOne(() => Game, (game) => game.id, {
    cascade: true,
    onDelete: "CASCADE",
  })
  game_id: Game;

  @Column({ type: "enum", enum: cards })
  cards: allCard[];
}
