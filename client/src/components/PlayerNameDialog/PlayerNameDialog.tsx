"use client";

import { playerNameSchema } from "@shared/playerSchemas";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent
} from "react";
import { typography } from "../../design-system/typography";
import { ApiError, createPlayer } from "../../lib/api";
import { useAuth } from "../AuthProvider/AuthProvider";
import { usePlayer } from "../PlayerProvider/PlayerProvider";
import { Button } from "../Button/Button";
import { TextInput } from "../TextInput/TextInput";

export function PlayerNameDialog() {
  const { user } = useAuth();
  const { setPlayer } = usePlayer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Choosing a name is mandatory; block Esc from closing the dialog.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || isSubmitting) {
      return;
    }

    const parsed = playerNameSchema.safeParse(name);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const player = await createPlayer(user, parsed.data);
      setPlayer(player);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Something went wrong. Try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      aria-label="Choose your name"
      className="fixed inset-0 m-auto w-11/12 max-w-xl rounded-panel border border-line bg-surface-raised p-0 text-ink shadow-panel backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      onCancel={handleCancel}
      ref={dialogRef}
    >
      <div className="border-b border-line p-6">
        <p className={`m-0 ${typography.eyebrow}`}>Welcome to the family</p>
        <h2 className={`mt-3 mb-0 ${typography.dialogTitle}`}>
          Choose your name
        </h2>
      </div>
      <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
        <p className={`m-0 ${typography.subtitle}`}>
          This is how the city will know you. Choose carefully — it cannot be
          changed later.
        </p>
        <TextInput
          autoComplete="off"
          autoFocus
          disabled={isSubmitting}
          error={error ?? undefined}
          id="player-name"
          label="Name"
          maxLength={30}
          onChange={(event) => setName(event.target.value)}
          placeholder="Rico Vale"
          value={name}
        />
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Making it official…" : "Claim the name"}
        </Button>
      </form>
    </dialog>
  );
}
