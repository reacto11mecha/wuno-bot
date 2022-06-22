import {
  Entity,
  ObjectIdColumn,
  ObjectID,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class GameProperty {
  @Column()
  isJoiningGame: boolean;

  @ObjectIdColumn({ primary: false })
  gameUID: ObjectID;

  @Column()
  gameID: string;
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
