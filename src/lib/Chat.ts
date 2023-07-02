import type {
  MessageSendOptions,
  Message,
  Client,
  Contact,
  MessageContent,
  MessageMedia,
} from "whatsapp-web.js";
import { Logger } from "pino";
import pLimit from "p-limit";

import { env } from "../env";
import type { UserGameProperty, User } from "../handler/database";

/**
 * Interface for accessible Chat's message property
 */
export interface IMessage {
  /**
   * User number
   */
  userNumber: string;

  /**
   * User username
   */
  userName: string;

  /**
   * Incoming chat from property
   */
  from: string;

  /**
   * Incoming chat specific message id
   */
  id: string;
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
   * Actual incoming message object
   */
  private incomingMessage: Message;

  /**
   * Message limitter instance from p-limit
   */
  private limitter: ReturnType<typeof pLimit>;

  /**
   * Current chatter contact instance
   */
  private contact: Contact;

  /**
   * Accessible user document by phone number
   */
  user?: User;

  /**
   * Accessible user game property by phone number
   */
  gameProperty?: UserGameProperty;

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
   * @param contact Current chatter contact instance
   */
  constructor(
    client: Client,
    IncomingMessage: Message,
    logger: Logger,
    limitter: ReturnType<typeof pLimit>,
    contact: Contact
  ) {
    this.client = client;
    this.logger = logger;
    this.contact = contact;
    this.limitter = limitter;
    this.incomingMessage = IncomingMessage;

    this.message = {
      userNumber: contact.id._serialized,
      userName: contact.pushname,
      from: IncomingMessage.from,
      id: IncomingMessage.id.id,
    };

    this.args = IncomingMessage.body
      .slice(env.PREFIX.length)
      .trim()
      .split(/ +/)
      .slice(1);
  }

  /**
   * Send text or image with caption to current person chatter
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
  async sendToCurrentPerson(
    content: MessageContent | MessageSendOptions,
    image?: MessageMedia
  ) {
    await this.sendToOtherPerson(this.message.from, content, image);
  }

  /**
   * Reply current chatter using text or image with caption to current person chatter
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
  async replyToCurrentPerson(
    content: MessageContent | MessageSendOptions,
    image?: MessageMedia
  ) {
    if (image) {
      await this.limitter(
        async () =>
          await this.incomingMessage.reply(
            image,
            this.message.from,
            content as MessageSendOptions
          )
      );
    } else {
      await this.limitter(
        async () => await this.incomingMessage.reply(content as MessageContent)
      );
    }
  }

  /**
   * Send reaction to current person chatter
   * @param emoji Emoji that will sended
   */
  async reactToCurrentPerson(emoji: string) {
    await this.limitter(async () => await this.incomingMessage.react(emoji));
  }

  /**
   * Send text or image with caption to someone
   * @param content The text that will sended
   * @param image Image that will sended in base64 data URL (Optional)
   */
  async sendToOtherPerson(
    to: string,
    content: MessageContent | MessageSendOptions,
    image?: MessageMedia
  ) {
    if (image) {
      await this.limitter(
        async () =>
          await this.client.sendMessage(
            to,
            image,
            content as MessageSendOptions
          )
      );
    } else {
      await this.limitter(
        async () => await this.client.sendMessage(to, content as MessageContent)
      );
    }
  }

  /**
   * Get current contact profile picture string
   */
  async getContactProfilePicture() {
    return await this.contact.getProfilePicUrl();
  }

  /**
   * Current chatter have quoted message that have media in it
   */
  async hasQuotedMessageMedia() {
    const hasQuotedMessage = this.incomingMessage.hasQuotedMsg;

    if (hasQuotedMessage) {
      const quotedMessage = await this.incomingMessage.getQuotedMessage();
      const quotedMessageMedia = await quotedMessage.downloadMedia();

      return {
        quotedMessage,
        hasQuotedMessage,
        quotedMessageMedia,
      };
    }

    return {
      hasQuotedMessage,
    };
  }

  /**
   * User property setter
   * @param user An user document by phone number
   */
  setUserAndGameProperty(user: User, gameProperty: UserGameProperty) {
    this.user = user;
    this.gameProperty = gameProperty;
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
}
