import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  console.log(chat);
  console.log(game);
});
