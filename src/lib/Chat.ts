import type { proto, WASocket, AnyMessageContent } from "@adiwajshing/baileys";
import { DocumentType } from "@typegoose/typegoose";
import { Logger } from "pino";

import { UserModel, User } from "../models";

interface IMessage {
  userNumber: string;
  userName: string;
  remoteJid: string;
  id: string;
}

const PREFIX = process.env.PREFIX || "U#";

export class Chat {
  sock: WASocket;
  logger: Logger;
  message: IMessage;
  private WebMessage: proto.IWebMessageInfo;
  user?: DocumentType<User>;
  args: string[];

  constructor(
    sock: WASocket,
    WebMessage: proto.IWebMessageInfo,
    logger: Logger
  ) {
    this.sock = sock;
    this.logger = logger;
    this.WebMessage = WebMessage;

    this.message = {
      userNumber: `${
        WebMessage.key.remoteJid!.endsWith("@g.us")
          ? WebMessage.key.participant!
          : WebMessage.key.remoteJid!
      }`,
      userName: WebMessage.pushName!,
      remoteJid: WebMessage.key.remoteJid!,
      id: WebMessage.key.id!,
    };

    this.args = WebMessage.message!.conversation!.slice(PREFIX.length)
      .trim()
      .split(/ +/)
      .slice(1);
  }

  private async _simulateTyping(
    remoteJid: string,
    sendCb: () => Promise<void>
  ) {
    await this.sock.presenceSubscribe(remoteJid);
    await this.sock.sendPresenceUpdate("composing", remoteJid);

    await sendCb();

    await this.sock.sendPresenceUpdate("paused", remoteJid);
  }

  private async _sendTo(remoteJid: string, message: AnyMessageContent) {
    await this.sock.sendMessage(remoteJid, message);
  }

  async simulateTypingToCurrentPerson(callback: () => Promise<void>) {
    await this._simulateTyping(this.message.remoteJid, callback);
  }

  async sendToCurrentPerson(message: AnyMessageContent) {
    await this._simulateTyping(
      this.message.remoteJid,
      async () => await this._sendTo(this.message.remoteJid, message)
    );
  }

  async replyToCurrentPerson(message: AnyMessageContent) {
    await this._simulateTyping(this.message.remoteJid, async () => {
      await this.sock.sendMessage(this.message.remoteJid, message, {
        quoted: this.WebMessage,
      });
    });
  }

  async sendToOtherPerson(remoteJid: string, message: AnyMessageContent) {
    await this._sendTo(remoteJid, message);
  }

  setUser(user: DocumentType<User>) {
    this.user = user;
  }

  get isDMChat() {
    return this.message.remoteJid.endsWith("@c.us");
  }
  get isGroupChat() {
    return this.message.remoteJid.endsWith("@g.us");
  }

  get isJoiningGame() {
    return this.gameProperty?.isJoiningGame;
  }
  get gameProperty() {
    return this.user?.gameProperty;
  }
}
