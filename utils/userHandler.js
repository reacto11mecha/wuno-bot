import { isDMChat as _dm } from "../lib/processMessage.js";
import User from "../models/user.js";

const findOrCreateUser =
  (cb = false) =>
  async (args) => {
    await args.client.simulateTyping(args.from, true);

    const user = await User.findOne({ phoneNumber: args.userNumber });

    if (!user) {
      try {
        const newUser = new User({
          phoneNumber: args.userNumber,
          userName: args.sender.pushname,
        });
        await newUser.save();

        args.logger.info(
          `[DB] Berhasil mendaftarkan user dengan username: ${args.sender.pushname}`
        );

        await args.client.simulateTyping(args.from, false);

        if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else if (cb) return await cb({ ...args, user: newUser });
        else return newUser;
      } catch (error) {
        // maybe it's a racing condition when the user is not registered,
        // but mongoose does the second registration from the same user
        args.logger.error(error);

        const user = await User.findOne({ phoneNumber: args.userNumber });

        if (user.userName !== args.sender.pushname) {
          user.userName = args.sender.pushname;

          await user.save();
        }

        await args.client.simulateTyping(args.from, false);

        if (cb && !(cb instanceof Function))
          // Safety code
          throw new Error("Not a valid callback");
        else if (cb && cb instanceof Function)
          return await cb({ ...args, user });
        else return user;
      }
    }

    if (user.userName !== args.sender.pushname) {
      user.userName = args.sender.pushname;

      await user.save();
    }

    await args.client.simulateTyping(args.from, false);

    if (cb && !(cb instanceof Function))
      // Safety code
      throw new Error("Not a valid callback");
    else if (cb && cb instanceof Function) return await cb({ ...args, user });
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
