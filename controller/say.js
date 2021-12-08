import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(
  async ({ client, from, id, args, userNumber, game, players }) => {
    await client.simulateTyping(from, true);

    if (!game) {
      await client.reply(
        from,
        "Sebuah kesalahan, game tidak ditemukan!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    } else if (args.length < 1) {
      await client.reply(
        from,
        "Diperlukan pesan yang ingin dikirimkan!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    } else if (players.length < 1) {
      await client.reply(
        from,
        "Tidak ada lawan bicara yang bisa diajak berkomunikasi.",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    }

    const message = args.join(" ");
    const sender = players.find(
      ({ phoneNumber }) => phoneNumber === userNumber
    );

    await Promise.all(
      players
        .filter((user) => user.phoneNumber !== userNumber)
        .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`)
        .map(async (toSender) => {
          await client.simulateTyping(toSender, true);
          await client.sendText(toSender, `${sender.userName}: ${message}`);
          await client.simulateTyping(toSender, false);
        })
    );

    await client.reply(from, "Pesan terkirim!", id, true);
    await client.simulateTyping(from, false);
  }
);
