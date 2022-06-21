import {
  Entity,
  ObjectIdColumn,
  ObjectID,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";

import { Game } from "./game";

@Entity()
export class GameProperty {
  @Column()
  isJoiningGame: boolean;

  @ManyToOne(() => Game, (game) => game.id, {
    cascade: true,
    onDelete: "SET NULL",
  })
  gameUID: Game;

  @ManyToOne(() => Game, (game) => game.gameID, {
    cascade: true,
    onDelete: "SET NULL",
  })
  gameID: Game;

  constructor(isJoiningGame = false, gameInstance: Game) {
    this.isJoiningGame = isJoiningGame;
    this.gameUID = gameInstance;
    this.gameID = gameInstance;
  }
}

@Entity()
export class User {
  @ObjectIdColumn({ primary: true })
  id: ObjectID;

  @Column(() => GameProperty)
  gameProperty: GameProperty;

  @Column()
  userName: string;

  @Column({ unique: true })
  phoneNumber: string;

  @CreateDateColumn()
  created_at: Date;
}
