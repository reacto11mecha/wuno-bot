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

/**
 * Interface for accessible Chat's message property
 */
export interface IMessage {
  /**
   * User number
   */
  userNumber: ContactId;

  /**
   * User username
   */
  userName: string;

  /**
   * Incoming chat from property
   */
  from: ChatId;

  /**
   * Incoming chat specific message id
   */
  id: MessageId;
}

/**
 * Class for handling incoming chat and outcoming chat
 */
export class Chat {
  /**
   * Whatsapp client instance
   */
  client: Client;

  /**
   * Pino logger instance
   */
  logger: Logger;

  /**
   * Accessible message instance that contains information about incoming message
   */
  message: IMessage;

  /**
   * Message limitter instance from p-limit
   */
  private limitter: ReturnType<typeof pLimit>;

  /**
   * Accessible user document by phone number
   */
  user?: DocumentType<User>;

  /**
   * Args list from user command
   */
  args: string[];

  /**
   * Chat class constructor
   * @param client Open whatsaapp client instance
   * @param IncomingMessage Open whatsapp .onMessage message instance
   * @param logger Pino logger instance
   * @param limitter p-limit instance for limitting message
   */
  constructor(
    client: Client,
    IncomingMessage: Message,
    logger: Logger,
    limitter: ReturnType<typeof pLimit>
  ) {
    this.client = client;
    this.logger = logger;
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

  /**
   * Abstract function for sending text to someone
   * @param to Chat id for intended person
   * @param content The text that will sended
   */
  private async _sendText(to: ChatId, content: Content) {
    await this.limitter(async () => {
      await this.client.simulateTyping(to, true);
      await this.client.sendText(to, content);
      await this.client.simulateTyping(to, false);
    });
  }

  /**
   * Abstract function for sending image with caption to someone
   * @param to Chat id for intended person
   * @param caption The text that will sended
   * @param image Image that will sended in base64 data URL
   * @param quotedMsgId Quoted specific message for replying (Optional)
   */
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

  /**
   * Send text or image with caption to current person chatter
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
  async sendToCurrentPerson(content: Content, image?: DataURL) {
    if (image) {
      await this._sendImage(this.message.from, content, image);
    } else {
      await this._sendText(this.message.from, content);
    }
  }

  /**
   * Reply current chatter using text or image with caption to current person chatter
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
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

  /**
   * Send text or image with caption to someone
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
  async sendToOtherPerson(to: string, content: Content, image?: DataURL) {
    if (image) {
      await this._sendImage(<ChatId>to, content, image);
    } else {
      await this._sendText(<ChatId>to, content);
    }
  }

  /**
   * User property setter
   * @param user An user document by phone number
   */
  setUser(user: DocumentType<User>) {
    this.user = user;
  }

  /**
   * Is current chatter sending message via DM chat
   */
  get isDMChat() {
    return this.message.from.endsWith("@c.us");
  }

  /**
   * Is current chatter sending message via Group chat
   */
  get isGroupChat() {
    return this.message.from.endsWith("@g.us");
  }

  /**
   * Is current chatter joinin a game session
   */
  get isJoiningGame() {
    return this.gameProperty?.isJoiningGame;
  }

  /**
   * Retrieve game property from current chatter
   */
  get gameProperty() {
    return this.user?.gameProperty;
  }
}
