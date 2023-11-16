import { Chat } from "../lib/Chat";
import { prisma } from "../handler/database";

/**
 * Util for finding or create user if it doesn't exist
 * @param callback Callback that has basic chat instance parameter
 * @returns void
 */
export const findOrCreateUser =
  (callback: (chat: Chat) => Promise<void>) => async (chat: Chat) => {
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: chat.message.userNumber,
      },
    });

    if (!user) {
      try {
        const newUser = await prisma.user.create({
          data: {
            phoneNumber: chat.message.userNumber,
            username: chat.message.userName,
          },
        });
        const newGameProperty = await prisma.userGameProperty.create({
          data: {
            userId: newUser.id,
          },
        });

        chat.logger.info(
          `[DB] Berhasil mendaftarkan user dengan username: ${chat.message.userName}`,
        );

        chat.setUserAndGameProperty(newUser, newGameProperty);
        await callback(chat);
      } catch (error) {
        chat.logger.error(error);

        await chat.replyToCurrentPerson(
          "Terjadi Sebuah Kesalahan. Mohon coba sekali lagi perintah ini. Jika masih berlanjut hubungi administrator.",
        );
      }
    } else {
      let gameProperty = await prisma.userGameProperty.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!gameProperty) {
        gameProperty = await prisma.userGameProperty.create({
          data: {
            userId: user.id,
          },
        });
      }

      if (user.username !== chat.message.userName) {
        const updated = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            username: chat.message.userName,
          },
        });

        chat.setUserAndGameProperty(updated, gameProperty);
        await callback(chat);

        return;
      }

      chat.setUserAndGameProperty(user, gameProperty);
      await callback(chat);
    }
  };
