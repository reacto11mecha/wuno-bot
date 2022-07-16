import type {
  Message,
  Client,
  ChatId,
  ContactId,
  Content,
  MessageId,
  DataURL,
} from "@open-wa/wa-automate";
import { DocumentType } from "@typegoose/typegoose";
import { Logger } from "pino";
import pLimit from "p-limit";

import { PREFIX } from "../config/prefix";
import { User } from "../models";

export interface IMessage {
  userNumber: ContactId;
  userName: string;
  from: ChatId;
  id: MessageId;
}

export class Chat {
  client: Client;
  logger: Logger;
  message: IMessage;
  private IncomingMessage: Message;
  private limitter: ReturnType<typeof pLimit>;
  user?: DocumentType<User>;
  args: string[];

  constructor(
    client: Client,
    IncomingMessage: Message,
    logger: Logger,
    limitter: ReturnType<typeof pLimit>
  ) {
    this.client = client;
    this.logger = logger;
    this.IncomingMessage = IncomingMessage;
    this.limitter = limitter;

    this.message = {
      userNumber: IncomingMessage.sender.id,
      userName: IncomingMessage.sender.pushname,
      from: IncomingMessage.from,
      id: IncomingMessage.id,
    };

    this.args = IncomingMessage.body
      .slice(PREFIX.length)
      .trim()
      .split(/ +/)
      .slice(1);
  }

  private async _sendText(to: ChatId, content: Content) {
    await this.limitter(async () => {
      await this.client.simulateTyping(to, true);
      await this.client.sendText(to, content);
      await this.client.simulateTyping(to, false);
    });
  }

  private async _sendImage(
    to: ChatId,
    caption: Content,
    image: DataURL,
    quotedMsgId?: MessageId
  ) {
    await this.limitter(async () => {
      await this.client.simulateTyping(to, true);
      await this.client.sendImage(to, image, "img.png", caption, quotedMsgId);
      await this.client.simulateTyping(to, false);
    });
  }

  async sendToCurrentPerson(content: Content, image?: DataURL) {
    if (image) {
      await this._sendImage(this.message.from, content, image);
    } else {
      await this._sendText(this.message.from, content);
    }
  }

  async replyToCurrentPerson(content: Content, image?: DataURL) {
    if (image) {
      await this._sendImage(this.message.from, content, image, this.message.id);
    } else {
      await this.limitter(async () => {
        await this.client.simulateTyping(this.message.from, true);
        await this.client.reply(this.message.from, content, this.message.id);
        await this.client.simulateTyping(this.message.from, false);
      });
    }
  }

  async sendToOtherPerson(to: string, content: Content, image?: DataURL) {
    if (image) {
      await this._sendImage(<ChatId>to, content, image);
    } else {
      await this._sendText(<ChatId>to, content);
    }
  }

  setUser(user: DocumentType<User>) {
    this.user = user;
  }

  get isDMChat() {
    return this.message.from.endsWith("@c.us");
  }
  get isGroupChat() {
    return this.message.from.endsWith("@g.us");
  }

  get isJoiningGame() {
    return this.gameProperty?.isJoiningGame;
  }
  get gameProperty() {
    return this.user?.gameProperty;
  }
}
