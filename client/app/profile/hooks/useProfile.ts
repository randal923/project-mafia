"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import type { Profile } from "../lib/profileModel";

type ProfileResponse = {
  profile: Profile;
};

type ProfileRecord = {
  profile: Profile;
  userId: string;
};

type ProfileError = {
  message: string;
  userId: string;
};

type UseProfileResult = {
  currentFormError: string | null;
  currentLoadError: string | null;
  isSaving: boolean;
  isSignedIn: boolean;
  nickname: string;
  profile: Profile | null;
  saveNickname: () => Promise<void>;
  setNickname: (nickname: string) => void;
};

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const [profileRecord, setProfileRecord] = useState<ProfileRecord | null>(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [formError, setFormError] = useState<ProfileError | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<ProfileError | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    void user
      .getIdToken()
      .then((idToken) =>
        fetch("/api/profile", {
          body: JSON.stringify({}),
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
      )
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Profile could not be loaded.");
        }

        return (await response.json()) as ProfileResponse;
      })
      .then((payload) => {
        if (isCancelled) {
          return;
        }

        setFormError(null);
        setLoadError(null);
        setNickname(payload.profile.nickname);
        setProfileRecord({
          profile: payload.profile,
          userId: user.uid,
        });
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        setLoadError({
          message:
            loadError instanceof Error
              ? loadError.message
              : "Profile could not be loaded.",
          userId: user.uid,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const currentFormError =
    formError && formError.userId === user?.uid ? formError.message : null;
  const currentLoadError =
    loadError && loadError.userId === user?.uid ? loadError.message : null;
  const profile =
    profileRecord && profileRecord.userId === user?.uid
      ? profileRecord.profile
      : null;

  const saveNickname = async () => {
    if (!user) {
      return;
    }

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setFormError({
        message: "Nickname is required.",
        userId: user.uid,
      });
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/profile", {
        body: JSON.stringify({ nickname: trimmedNickname }),
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Nickname could not be saved.");
      }

      const payload = (await response.json()) as ProfileResponse;

      setProfileRecord({
        profile: payload.profile,
        userId: user.uid,
      });
      setNickname(payload.profile.nickname);
    } catch (saveError) {
      setFormError({
        message:
          saveError instanceof Error
            ? saveError.message
            : "Nickname could not be saved.",
        userId: user.uid,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentFormError,
    currentLoadError,
    isSaving,
    isSignedIn: Boolean(user),
    nickname,
    profile,
    saveNickname,
    setNickname,
  };
}
