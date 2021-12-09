import mongoose from "mongoose";
import User from "../models/user.js";

export default class Chat {
  constructor(client, message, logger) {
    const { body, from, sender, id } = message;
    const userNumber = `+${sender.id.replace("@c.us", "")}`;

    this.client = client;
    this.user = null;
    this.logger = logger;

    this.message = { from, sender, id, userNumber };
    this.args = body
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/)
      .slice(1);
  }

  async _simulateTyping(from, boolean) {
    await this.client.simulateTyping(from, boolean);
  }

  async _sendTo(from, text) {
    await this._simulateTyping(from, true);
    await this.client.sendText(from, text, true);
    await this._simulateTyping(from, false);
  }

  async typingToCurrentPerson(boolean) {
    await this._simulateTyping(this.from, boolean);
  }

  async replyToCurrentPerson(text) {
    await this.typingToCurrentPerson(this.from, true);
    await this.client.reply(this.from, text, this.id, true);
    await this.typingToCurrentPerson(this.from, false);
  }

  async sendToCurrentPerson(text) {
    await this._sendTo(this.from, text);
  }
  async sendToOtherPlayer(toSender, text) {
    await this._sendTo(toSender, text);
  }

  async sendToOtherPlayers(players, text) {
    await Promise.all(
      players
        .filter((user) => user.phoneNumber !== this.message.userNumber)
        .map(
          async (user) =>
            await this.sendToOtherPlayer(
              `${user.phoneNumber.replace("+", "")}@c.us`,
              text
            )
        )
    );
  }

  set setUser(user) {
    // Check if parameter is result from creating
    // new user or getting stored user data
    if (user instanceof mongoose.Query || user instanceof User)
      this.user = user;
    else throw new Error("Invalid user data type!");
  }

  get username() {
    return this.message.sender.pushname;
  }

  get isDMChat() {
    return this.message.from.endsWith("@c.us");
  }
  get isGroupChat() {
    return this.message.from.endsWith("@g.us");
  }

  get isJoiningGame() {
    return this.user?.gameProperty.isJoiningGame;
  }
  get gameProperty() {
    return this.user?.gameProperty;
  }
}
