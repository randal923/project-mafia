import type { User } from "firebase/auth";
import type { Player } from "../models/player";
import { AppErrorHandler, type AppErrorResult } from "./errors";

type PlayerResponse = {
  player: Player;
};

type PlayerRequestBody = {
  nickname?: string;
};

type PlayerServiceSuccess = {
  ok: true;
  player: Player;
};

type PlayerServiceFailure = {
  error: AppErrorResult;
  ok: false;
};

export type PlayerServiceResult =
  | PlayerServiceFailure
  | PlayerServiceSuccess;

export class PlayerService {
  static async getPlayer(user: User): Promise<PlayerServiceResult> {
    return PlayerService.postPlayer(
      user,
      {},
      "Player could not be loaded.",
    );
  }

  static async saveNickname(
    user: User,
    nickname: string,
  ): Promise<PlayerServiceResult> {
    return PlayerService.postPlayer(
      user,
      { nickname },
      "Nickname could not be saved.",
    );
  }

  private static async postPlayer(
    user: User,
    body: PlayerRequestBody,
    fallbackMessage: string,
  ): Promise<PlayerServiceResult> {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/player", {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw await AppErrorHandler.createAPIError(response, fallbackMessage);
      }

      const payload = (await response.json()) as PlayerResponse;

      return {
        ok: true,
        player: payload.player,
      };
    } catch (error) {
      return {
        error: AppErrorHandler.toResult(error, fallbackMessage),
        ok: false,
      };
    }
  }
}
