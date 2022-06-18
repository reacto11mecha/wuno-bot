import { Chat } from "../lib/Chat";
import User from "../models/user";

export const findOrCreateUser =
  (callback: (chat: Chat) => Promise<void>) => async (chat: Chat) => {
    const properNumber = `+${chat.message.userNumber.replace(
      "@s.whatsapp.net",
      ""
    )}`;

    await chat.simulateTypingToCurrentPerson(async () => {
      const user = await User.findOne({ phoneNumber: properNumber });

      if (!user) {
        try {
          const newUser = new User({
            phoneNumber: properNumber,
            userName: chat.message.userName,
          });
          await newUser.save();

          chat.logger.info(
            `[DB] Berhasil mendaftarkan user dengan username: ${chat.message.userName}`
          );

          chat.setUser(newUser);
          await callback(chat);
        } catch (error) {
          chat.logger.error(error);

          await chat.replyToCurrentPerson({
            text: "Terjadi Sebuah Kesalahan. Mohon coba sekali lagi perintah ini. Jika masih berlanjut hubungi administrator.",
          });
        }
      } else {
        if (user.userName !== chat.message.userName) {
          user.userName = chat.message.userName;

          await user.save();
        }

        chat.setUser(user);

        await callback(chat);
      }
    });
  };
