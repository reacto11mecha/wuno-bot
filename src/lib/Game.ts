import { Chat } from "./Chat";

import { calcElapsedTime, random } from "../utils";

import { prisma, FullGameType, User, Player } from "../lib/database";

import type { allCard } from "../config/cards";
import { CardPicker } from "../config/cards";
import {
  MessageContent,
  MessageMedia,
  MessageSendOptions,
} from "whatsapp-web.js";

/**
 * Class for handling user game event
 */
export class Game {
  /**
   * Game document by specific user
   */
  private game: FullGameType;

  /**
   * Chat message instance
   */
  private chat: Chat;

  /**
   * Game class constructor
   * @param gameData Game document by specific user
   * @param chat Chat message instance
   */
  constructor(gameData: FullGameType, chat: Chat) {
    this.game = gameData;
    this.chat = chat;
  }

  /**
   * Abstract function that used for checking specific player is it turn or not
   * @param user The specific player
   * @returns Boolean that indicate is player turn or not
   */
  private _isPlayerTurn(user: User) {
    return this.game.currentPlayerId === user.id;
  }

  /**
   * Function for starting current game
   */
  async startGame() {
    const shuffledPlayers = this.players
      .sort(() => random() - 0.5)
      .map((player) => player.playerId);
    const currentPlayer = shuffledPlayers[0];
    const startCard = CardPicker.getInitialCard();

    await prisma.$transaction([
      prisma.game.update({
        where: {
          id: this.game.id,
        },
        data: {
          status: "PLAYING",
          started_at: new Date(),
          currentCard: startCard,
          currentPlayerId: currentPlayer,
        },
      }),

      ...shuffledPlayers.map((playerId, idx) =>
        prisma.playerOrder.create({
          data: {
            gameId: this.game.id,
            playerId,
            playerOrder: idx + 1,
          },
        })
      ),
    ]);

    const userCards = await prisma.$transaction(
      shuffledPlayers.map((playerId) =>
        prisma.userCard.create({
          data: {
            gameId: this.game.id,
            playerId,
          },
        })
      )
    );

    await prisma.$transaction(
      userCards
        .map((user) => Array.from({ length: 6 }).map(() => user))
        .flat()
        .map((userCard) =>
          prisma.card.create({
            data: {
              cardName: CardPicker.pickCardByGivenCard(startCard),
              cardId: userCard.id,
            },
          })
        )
    );

    const updatedGameState = await prisma.game.findUnique({
      where: {
        id: this.game.id,
      },
      include: {
        allPlayers: true,
        bannedPlayers: true,
        cards: true,
        playerOrders: true,
      },
    });

    this.game = updatedGameState!;
  }

  /**
   * Function for joining current game
   */
  async joinGame() {
    const id = this.chat.user!.id;

    const [, updatedGameState] = await prisma.$transaction([
      prisma.userGameProperty.update({
        where: {
          userId: id,
        },
        data: {
          isJoiningGame: true,
          gameID: this.game.gameID,
        },
      }),
      prisma.game.update({
        where: {
          id: this.game.id,
        },
        data: {
          allPlayers: {
            create: {
              playerId: id,
            },
          },
        },
        include: {
          allPlayers: true,
          bannedPlayers: true,
          cards: true,
          playerOrders: true,
        },
      }),
    ]);

    this.game = updatedGameState;
  }

  /**
   * Function for end current game
   */
  async endGame() {
    const [, updatedGameState] = await prisma.$transaction([
      prisma.userCard.deleteMany({
        where: {
          gameId: this.game.id,
        },
      }),
      prisma.game.update({
        where: {
          id: this.game.id,
        },
        data: {
          ended_at: new Date(),
          status: "ENDED",
          playerOrders: {
            deleteMany: {},
          },
          allPlayers: {
            deleteMany: {},
          },
          bannedPlayers: {
            deleteMany: {},
          },
        },
        include: {
          allPlayers: true,
          bannedPlayers: true,
          cards: true,
          playerOrders: true,
        },
      }),
      ...this.players.map((player) =>
        prisma.userGameProperty.update({
          where: {
            userId: player.playerId,
          },
          data: {
            isJoiningGame: false,
            gameID: null,
          },
        })
      ),
    ]);

    this.game = updatedGameState;

    this.chat.logger.info(`[DB] Game ${this.game.gameID} selesai`);
  }

  /**
   * Function for updating user gameProperty for not joining game session anymore
   * @param _id Specific user id
   */
  async leaveGameForUser(id: number) {
    await prisma.userGameProperty.update({
      where: {
        userId: id,
      },
      data: {
        isJoiningGame: false,
      },
    });
  }

  /**
   * Function for removing user from player array (leaving, get kicked)
   * @param _id Specific user id
   */
  async removeUserFromArray(id: number) {
    const playerOrdersExist = this.game.playerOrders.length > 0;
    const cardsExist = this.game.cards.length > 0;

    await prisma.$transaction([
      prisma.game.update({
        where: {
          id: this.game.id,
        },
        data: {
          allPlayers: {
            delete: {
              playerId: id,
            },
          },
          playerOrders: playerOrdersExist
            ? {
                delete: {
                  playerId: id,
                },
              }
            : {},
          cards: cardsExist
            ? {
                delete: {
                  playerId: id,
                },
              }
            : {},
        },
      }),
      prisma.userGameProperty.update({
        where: {
          userId: id,
        },
        data: {
          isJoiningGame: false,
          gameID: null,
        },
      }),
    ]);
  }

  /**
   * Function for adding user on banned player array
   * @param id Specific user id
   */
  async addUserToBannedList(id: number) {
    await prisma.game.update({
      where: {
        id: this.game.id,
      },
      data: {
        bannedPlayers: {
          create: {
            playerId: id,
          },
        },
      },
    });
  }

  /**
   * Function for updating game current position
   * @param position User specific id
   */
  async updatePosition(position: number) {
    await prisma.game.update({
      where: {
        id: this.game.id,
      },
      data: {
        currentPlayerId: position,
      },
    });
  }

  /**
   * Function for updating game current card and current position
   * @param card Valid given card
   * @param position User specific id
   */
  async updateCardAndPosition(card: allCard, position: number) {
    const updatedGameState = await prisma.game.update({
      where: {
        id: this.game.id,
      },
      data: {
        currentCard: card,
        currentPlayerId: position,
      },
      include: {
        allPlayers: true,
        bannedPlayers: true,
        cards: true,
        playerOrders: true,
      },
    });

    this.game = updatedGameState;
  }

  /**
   * Function for reversing players order (uno reverse card)
   */
  async reversePlayersOrder() {
    if (this.game.playerOrders) {
      const reversedList = this.game.playerOrders
        .reverse()
        .map((player, idx) => ({ ...player, playerOrder: idx + 1 }));

      await prisma.$transaction(
        reversedList.map((list) =>
          prisma.game.update({
            where: {
              id: this.game.id,
            },
            data: {
              playerOrders: {
                update: {
                  where: {
                    playerId: list.playerId,
                  },
                  data: {
                    playerOrder: list.playerOrder,
                  },
                },
              },
            },
          })
        )
      );

      const updatedGameState = await prisma.game.findUnique({
        where: {
          id: this.game.id,
        },
        include: {
          allPlayers: true,
          bannedPlayers: true,
          cards: true,
          playerOrders: true,
        },
      });

      this.game = updatedGameState!;
    }
  }

  /**
   * Send message or image with caption to all players without current player
   * @param message Text that will sended
   * @param image Image that will sended (Optional)
   */
  async sendToOtherPlayersWithoutCurrentPlayer(
    message: MessageContent | MessageSendOptions,
    image?: MessageMedia
  ) {
    if (this.players.length > 0) {
      const users = await Promise.all(
        this.players.map((user) =>
          prisma.user.findUnique({
            where: { id: user.id },
          })
        )
      );

      await Promise.all(
        users
          .filter((user) => user?.phoneNumber !== this.chat.message.userNumber)
          .filter((user) => user?.id !== this.game.currentPlayerId)
          .map(async (user) => {
            if (user)
              await this.chat.sendToOtherPerson(
                user.phoneNumber,
                message,
                image
              );
          })
      );
    }
  }

  /**
   * Send message or image with caption to all players without current person
   * @param message Text that will sended
   * @param players Players list (optional)
   * @param image Image that will send (optional)
   */
  async sendToOtherPlayersWithoutCurrentPerson(
    message: MessageContent | MessageSendOptions,
    players?: Player[],
    image?: MessageMedia
  ) {
    if (players && players.length > 0) {
      const users = await Promise.all(
        players.map((user) =>
          prisma.user.findUnique({
            where: { id: user.playerId },
          })
        )
      );

      await Promise.all(
        users
          .filter((user) => user?.phoneNumber !== this.chat.message.userNumber)
          .map(async (user) => {
            if (user)
              await this.chat.sendToOtherPerson(
                user.phoneNumber,
                message,
                image
              );
          })
      );

      return;
    }

    const users = await Promise.all(
      this.players.map((user) =>
        prisma.user.findUnique({
          where: { id: user.playerId },
        })
      )
    );

    await Promise.all(
      users
        .filter((user) => user?.phoneNumber !== this.chat.message.userNumber)
        .map(async (user) => {
          if (user)
            await this.chat.sendToOtherPerson(user.phoneNumber, message, image);
        })
    );
  }

  /**
   * Function for set game creator
   */
  async setCreatorId(id: number) {
    await prisma.game.update({
      where: {
        id: this.game.id,
      },
      data: {
        gameCreatorId: id,
      },
    });
  }

  /**
   * Function for set game winner
   */
  async setWinner(id: number) {
    const updatedGame = await prisma.game.update({
      where: {
        id: this.game.id,
      },
      data: {
        winnerId: id,
      },
      include: {
        allPlayers: true,
        bannedPlayers: true,
        cards: true,
        playerOrders: true,
      },
    });

    this.game = updatedGame;
  }

  /**
   * Get current player user document
   */
  async getCurrentPlayerUserData() {
    const currentGame = await prisma.game.findUnique({
      where: {
        id: this.game.id,
      },
    });

    if (!currentGame?.currentPlayerId) return null;

    return await prisma.user.findUnique({
      where: {
        id: currentGame.currentPlayerId,
      },
    });
  }

  /**
   * Get user document that created this game
   */
  async getCreatorUser() {
    return await prisma.user.findUnique({
      where: {
        id: this.game.gameCreatorId,
      },
    });
  }

  /**
   * Get all player user document
   */
  async getAllPlayerUserObject() {
    return await Promise.all(
      this.players.map((player) =>
        prisma.user.findUnique({ where: { id: player.playerId } })
      )
    );
  }

  /**
   * Function that will retrieve user next position
   * @param increment What is N-Position next player (default 1)
   * @returns User specific id document
   */
  getNextPosition(increment = 1) {
    if (isNaN(increment) || increment < 1) throw new Error("Invalid increment");

    if (this.game.playerOrders.length > 0 && this.game.currentPlayerId) {
      const playersOrder = this.game.playerOrders.sort(
        (a, b) => a.playerOrder - b.playerOrder
      );
      const currentPlayer = this.game.currentPlayerId;

      const currentIndex = playersOrder.findIndex(
        (player) => player.playerId === currentPlayer
      );

      const nextPlayerID =
        playersOrder[(currentIndex + increment) % playersOrder.length];

      return this.players.find(
        (player) => player.playerId === nextPlayerID.playerId
      );
    }
  }

  /**
   * Function for retrieve elapsed since game started and ended
   * @returns Human readable elapsed time
   */
  getElapsedTime() {
    return calcElapsedTime(this.game.started_at!, this.game.ended_at!);
  }

  /**
   * Function for retrieve if given player was already banned
   * @param id Specific user id
   * @returns True or false boolean
   */
  isPlayerGotBanned(id: number) {
    return !!this.game.bannedPlayers?.find((player) => player.playerId === id);
  }

  /**
   * Get list of all players order id
   */
  get playersOrderIds() {
    return this.game.playerOrders.map((player) => player.playerId);
  }

  /**
   * Get this game session unique id
   */
  get uid() {
    return this.game.id;
  }

  /**
   * Get this game session human readable id
   */
  get gameID() {
    return this.game.gameID;
  }

  /**
   * Get this game current position id
   */
  get currentPositionId() {
    return this.game.currentPlayerId;
  }

  /**
   * Get this game a time when it's created
   */
  get created_at() {
    return this.game.created_at;
  }

  /**
   * Get this game current state
   */
  get state() {
    return {
      WAITING: this.game.status === "WAITING",
      PLAYING: this.game.status === "PLAYING",
      ENDED: this.game.status === "ENDED",
    };
  }

  /**
   * Get if this game is not found
   */
  get NotFound() {
    return !this.game;
  }

  /**
   * Get this game human readable status
   */
  get translatedStatus() {
    switch (this.game.status) {
      case "WAITING":
        return "Menunggu Pemain";
      case "PLAYING":
        return "Sedang Bermain";
      case "ENDED":
        return "Selesai Bermain";
      default:
        return "N/A";
    }
  }

  /**
   * Get all players of this game
   */
  get players() {
    return this.game.allPlayers;
  }

  /**
   * Get current card of this game
   */
  get currentCard() {
    return this.game.currentCard;
  }

  /**
   * Get if current chatter is game creator or not
   */
  get isGameCreator() {
    return this.chat.user!.id === this.game.gameCreatorId;
  }

  /**
   * Get if current player is an author of this game
   */
  get currentPlayerIsAuthor() {
    return this.game.gameCreatorId === this.game.currentPlayerId;
  }

  /**
   * Get this game winner player id if there is a winner
   */
  get winner() {
    return this.game.winnerId;
  }

  /**
   * Get if current chatter is it turn to play
   */
  get isCurrentChatTurn() {
    return this._isPlayerTurn(this.chat.user!);
  }
}
