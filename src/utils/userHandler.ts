import { Chat } from "../lib/Chat";
import { UserModel } from "../models";

export const findOrCreateUser =
  (callback: (chat: Chat) => Promise<void>) => async (chat: Chat) => {
    await chat.simulateTypingToCurrentPerson(async () => {
      const user = await UserModel.findOne({
        phoneNumber: chat.message.userNumber,
      });

      if (!user) {
        try {
          const newUser = await UserModel.create({
            phoneNumber: chat.message.userNumber,
            userName: chat.message.userName,
          });

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
