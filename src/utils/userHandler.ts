import { Chat } from "../lib/Chat";
import { UserModel } from "../models";

/**
 * Util for finding or create user if it doesn't exist
 * @param callback Callback that has basic chat instance parameter
 * @returns void
 */
export const findOrCreateUser =
  (callback: (chat: Chat) => Promise<void>) => async (chat: Chat) => {
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

        await chat.replyToCurrentPerson(
          "Terjadi Sebuah Kesalahan. Mohon coba sekali lagi perintah ini. Jika masih berlanjut hubungi administrator."
        );
      }
    } else {
      if (user.userName !== chat.message.userName) {
        user.userName = chat.message.userName;
        await user.save();
      }

      chat.setUser(user);
      await callback(chat);
    }
  };
