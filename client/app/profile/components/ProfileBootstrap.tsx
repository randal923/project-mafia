"use client";

import { Button } from "../../components/Button";
import { useProfile } from "../../hooks/useProfile";

export function ProfileBootstrap() {
  const {
    currentFormError,
    currentLoadError,
    isSaving,
    isSignedIn,
    nickname,
    profile,
    saveNickname,
    setNickname,
  } = useProfile();

  if (!isSignedIn) {
    return null;
  }

  if (profile?.nickname || (!profile && !currentLoadError)) {
    return null;
  }

  return (
    <div
      aria-labelledby="nickname-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-veil px-5 py-8"
      role="dialog"
    >
      <form
        className="w-full max-w-sm border border-line bg-charcoal p-5 shadow-menu"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveNickname();
        }}
      >
        <h2
          className="font-serif text-3xl font-bold uppercase tracking-widest text-sulfur"
          id="nickname-title"
        >
          Nickname
        </h2>
        <label
          className="mt-5 block text-xs uppercase tracking-widest text-ash"
          htmlFor="nickname"
        >
          Street name
        </label>
        <input
          autoComplete="nickname"
          autoFocus
          className="mt-2 w-full border border-line bg-obsidian px-3 py-3 text-base text-ivory outline-none transition focus:border-sulfur"
          id="nickname"
          maxLength={32}
          onChange={(event) => setNickname(event.currentTarget.value)}
          value={nickname}
        />
        {currentLoadError && !currentFormError ? (
          <p className="mt-3 border border-blood bg-blood/20 px-3 py-2 text-sm text-ivory">
            {currentLoadError}
          </p>
        ) : null}
        {currentFormError ? (
          <p className="mt-3 border border-blood bg-blood/20 px-3 py-2 text-sm text-ivory">
            {currentFormError}
          </p>
        ) : null}
        <Button className="mt-5" disabled={isSaving} fullWidth type="submit">
          {isSaving ? "Saving" : "Claim name"}
        </Button>
      </form>
    </div>
  );
}
