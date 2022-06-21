import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
} from "typeorm";
import { cards, type allCard } from "../config/cards";

import { User } from "../entity";

export type statusType = "WAITING" | "PLAYING" | "ENDED";

@Entity()
export class Game {
  @ObjectIdColumn()
  id: ObjectID;

  @Column({ length: 11, unique: true })
  gameID: string;

  @Column({
    type: "enum",
    enum: ["WAITING", "PLAYING", "ENDED"],
    default: "WAITING",
  })
  status: statusType;

  @ManyToOne(() => User, (user) => user.id)
  gameCreatorID: User;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ type: "enum", enum: cards })
  currentCard: allCard;

  @ManyToOne(() => User, (user) => user.id)
  playersOrder: User[];

  @ManyToOne(() => User, (user) => user, { eager: true })
  players: User[];

  @ManyToOne(() => User, (user) => user.id)
  currentPosition: User;

  @CreateDateColumn()
  created_at: Date;
}
