import type { User } from "firebase/auth";
import type { Profile } from "../models/player";
import { AppErrorHandler, type AppErrorResult } from "./errors";

type ProfileResponse = {
  profile: Profile;
};

type ProfileRequestBody = {
  nickname?: string;
};

type ProfileServiceSuccess = {
  ok: true;
  profile: Profile;
};

type ProfileServiceFailure = {
  error: AppErrorResult;
  ok: false;
};

export type ProfileServiceResult =
  | ProfileServiceFailure
  | ProfileServiceSuccess;

export class ProfileService {
  static async getProfile(user: User): Promise<ProfileServiceResult> {
    return ProfileService.postProfile(
      user,
      {},
      "Profile could not be loaded.",
    );
  }

  static async saveNickname(
    user: User,
    nickname: string,
  ): Promise<ProfileServiceResult> {
    return ProfileService.postProfile(
      user,
      { nickname },
      "Nickname could not be saved.",
    );
  }

  private static async postProfile(
    user: User,
    body: ProfileRequestBody,
    fallbackMessage: string,
  ): Promise<ProfileServiceResult> {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/profile", {
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

      const payload = (await response.json()) as ProfileResponse;

      return {
        ok: true,
        profile: payload.profile,
      };
    } catch (error) {
      return {
        error: AppErrorHandler.toResult(error, fallbackMessage),
        ok: false,
      };
    }
  }
}
