import { isDMChat as _dm } from "../lib/processMessage.js";
import User from "../models/user.js";

const findOrCreateUser =
  (cb = false) =>
  async (chat) => {
    await chat.typingToCurrentPerson(true);

    const user = await User.findOne({ phoneNumber: chat.userNumber });

    if (!user) {
      try {
        const newUser = new User({
          phoneNumber: chat.userNumber,
          userName: chat.username,
        });
        await newUser.save();

        chat.logger.info(
          `[DB] Berhasil mendaftarkan user dengan username: ${chat.username}`
        );

        chat.setUser(newUser);

        await chat.typingToCurrentPerson(false);

        if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else if (cb) return await cb(chat);
        else return newUser;
      } catch (error) {
        // maybe it's a racing condition when the user is not registered,
        // but mongoose does the second registration from the same user
        chat.logger.error(error);

        const user = await User.findOne({ phoneNumber: chat.userNumber });

        if (user.userName !== chat.username) {
          user.userName = chat.username;

          await user.save();
        }

        await chat.typingToCurrentPerson(false);

        if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else if (cb && cb instanceof Function) return await cb(chat);
        else return user;
      }
    }

    if (user.userName !== chat.username) {
      user.userName = chat.username;

      await user.save();
    }

    await chat.typingToCurrentPerson(false);

    if (cb && !(cb instanceof Function))
      // Safety code
      throw new Error("Not a valid callback");
    else if (cb && cb instanceof Function) return await cb(chat);
    else return user;
  };

const _validatorBuilder = (checker, text) => (cb) => async (chat) =>
  await findOrCreateUser(async (chat) => {
    if (!checker(chat.message)) {
      await chat.replyToCurrentPerson(text);
      return false;
    }

    return await cb(chat);
  })(chat);

const isDMChat = _validatorBuilder(_dm, "Kirim pesan ini lewat DM WhatsApp !");

export { isDMChat, findOrCreateUser };
