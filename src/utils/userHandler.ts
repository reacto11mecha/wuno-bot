import { databaseSource } from "../handler/database";

import { Chat } from "../lib/Chat";
import { User } from "../entity";

export const findOrCreateUser =
  (callback: (chat: Chat) => Promise<void>) => async (chat: Chat) => {
    await chat.simulateTypingToCurrentPerson(async () => {
      const user = await databaseSource.manager.findOneBy(User, {
        phoneNumber: chat.message.userNumber,
      });

      if (!user) {
        try {
          const newUser = new User();
          newUser.phoneNumber = chat.message.userNumber;
          newUser.userName = chat.message.userName;

          await databaseSource.manager.save(newUser);

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
          await databaseSource.manager.update(User, user.id, {
            userName: chat.message.userName,
          });
        }

        chat.setUser(user);
        await callback(chat);
      }
    });
  };
