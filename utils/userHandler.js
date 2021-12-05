import { isDMChat as _dm } from "../lib/processMessage.js";
import User from "../models/user.js";

const findOrCreateUser =
  (cb = false) =>
  async (args) => {
    const user = await User.findOne({ phoneNumber: args.userNumber });

    if (!user) {
      try {
        const newUser = new User({ phoneNumber: args.userNumber });
        await newUser.save();

        args.logger.info(
          `[DB] Berhasil mendaftarkan user dengan username: ${args.sender.pushname}`
        );

        if (cb) return await cb({ ...args, user: newUser });
        else if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else return newUser;
      } catch (error) {
        // maybe it's a racing condition when the user is not registered,
        // but mongoose does the second registration from the same user
        args.logger.error(error);

        const user = await User.findOne({ phoneNumber: args.userNumber });

        if (cb && cb instanceof Function) return await cb({ ...args, user });
        else if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else return user;
      }
    }

    if (cb && cb instanceof Function) return await cb({ ...args, user });
    else if (cb && !(cb instanceof Function))
      // Safety code
      throw new Error("Not a valid callback");
    else return user;
  };

const _validatorBuilder = (checker, text) => (cb) => async (args) =>
  await findOrCreateUser(async (newArgs) => {
    if (!checker(args.message)) {
      await args.client.reply(args.from, text, args.id, true);
      return false;
    }

    return await cb(newArgs);
  })(args);

const isDMChat = _validatorBuilder(_dm, "Kirim pesan ini lewat DM WhatsApp !");

export { isDMChat, findOrCreateUser };
