"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../auth/useAuth";
import type { Profile } from "../models/player";
import { ProfileService } from "../services/profile";

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

const ProfileContext = createContext<UseProfileResult | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const profileState = useProfileState();

  return (
    <ProfileContext.Provider value={profileState}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): UseProfileResult {
  const profileState = useContext(ProfileContext);

  if (!profileState) {
    throw new Error("useProfile must be used within ProfileProvider.");
  }

  return profileState;
}

function useProfileState(): UseProfileResult {
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

    const loadProfile = async () => {
      const profileResult = await ProfileService.getProfile(user);

      if (isCancelled) {
        return;
      }

      if (!profileResult.ok) {
        setLoadError({
          message: profileResult.error.message,
          userId: user.uid,
        });
        return;
      }

      setFormError(null);
      setLoadError(null);
      setNickname(profileResult.profile.nickname);
      setProfileRecord({
        profile: profileResult.profile,
        userId: user.uid,
      });
    };

    void loadProfile();

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

    const profileResult = await ProfileService.saveNickname(
      user,
      trimmedNickname,
    );

    if (!profileResult.ok) {
      setFormError({
        message: profileResult.error.message,
        userId: user.uid,
      });
      setIsSaving(false);
      return;
    }

    setProfileRecord({
      profile: profileResult.profile,
      userId: user.uid,
    });
    setNickname(profileResult.profile.nickname);
    setIsSaving(false);
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
