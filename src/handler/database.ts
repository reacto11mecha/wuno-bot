import { DataSource } from "typeorm";
import { User, Game, Card } from "../entity";

export const databaseSource = new DataSource({
  type: "mongodb",
  host: "localhost",
  port: 27017,
  database: "wuno",
  entities: [User, Game, Card],
  useUnifiedTopology: true,
});
