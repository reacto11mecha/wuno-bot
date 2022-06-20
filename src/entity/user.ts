import { Entity, ObjectID, ObjectIdColumn, ManyToOne, Column } from "typeorm";

import { Game } from "./game";

@Entity()
export class GameProperty {
  @Column({ default: false })
  isJoiningGame: boolean;

  @ManyToOne(() => Game, (game) => game.id)
  gameUID: ObjectID;

  @ManyToOne(() => Game, (game) => game.gameID)
  gameID: string;

  constructor(isJoiningGame = false, gameUID: ObjectID, gameID: string) {
    this.isJoiningGame = isJoiningGame;
    this.gameUID = gameUID;
    this.gameID = gameID;
  }
}

@Entity()
export class User {
  @ObjectIdColumn()
  id: ObjectID;

  @Column(() => GameProperty)
  gameProperty: GameProperty;

  @Column()
  userName: string;

  @Column()
  phoneNumber: string;
}
