import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdminApp } from "../../firebase/getFirebaseAdminApp";
import { createDefaultPlayer } from "../../player/lib/createDefaultPlayer";
import {
  normalizeLoadout,
  shouldBackfillLoadout,
} from "../../player/lib/playerLoadoutDefaults";
import type { Player } from "../../models/player";

type PlayerWriteResult = {
  player: Player;
  status: 200 | 201;
};

export async function POST(request: Request) {
  try {
    const authorizationHeader = request.headers.get("authorization") ?? "";
    const idToken = authorizationHeader.startsWith("Bearer ")
      ? authorizationHeader.slice("Bearer ".length)
      : "";

    if (!idToken) {
      return NextResponse.json(
        { error: "A Firebase ID token is required." },
        { status: 401 },
      );
    }

    const parsedBody = (await request.json().catch(() => ({}))) as unknown;

    if (
      !parsedBody ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      return NextResponse.json(
        { error: "Player request body must be an object." },
        { status: 400 },
      );
    }

    const body = parsedBody as Record<string, unknown>;
    const nicknameValue = body.nickname;

    if (nicknameValue !== undefined && typeof nicknameValue !== "string") {
      return NextResponse.json(
        { error: "Nickname must be text." },
        { status: 400 },
      );
    }

    const nickname =
      typeof nicknameValue === "string" ? nicknameValue.trim() : null;

    if (nicknameValue !== undefined && !nickname) {
      return NextResponse.json(
        { error: "Nickname is required." },
        { status: 400 },
      );
    }

    if (nickname && nickname.length > 32) {
      return NextResponse.json(
        { error: "Nickname must be 32 characters or less." },
        { status: 400 },
      );
    }

    const adminApp = getFirebaseAdminApp();
    let decodedToken: DecodedIdToken;

    try {
      decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Firebase sign in could not be verified." },
        { status: 401 },
      );
    }

    const playerFallback = createDefaultPlayer({
      name:
        decodedToken.name ??
        decodedToken.email ??
        `Player ${decodedToken.uid.slice(0, 6)}`,
    });
    const firestore = getFirestore(adminApp);
    const playerRef = firestore.collection("players").doc(decodedToken.uid);
    const result = await firestore.runTransaction<PlayerWriteResult>(
      async (transaction) => {
        const playerSnapshot = await transaction.get(playerRef);

        if (!playerSnapshot.exists) {
          const createdPlayer = {
            ...playerFallback,
            nickname: nickname ?? "",
          };

          transaction.set(playerRef, createdPlayer);

          return {
            player: createdPlayer,
            status: 201,
          };
        }

        const existingData = playerSnapshot.data() as Player;
        const normalizedLoadout = normalizeLoadout(existingData.loadout);
        const existingPlayer = {
          ...existingData,
          loadout: normalizedLoadout,
        };
        const playerPatch: {
          loadout?: Player["loadout"];
          nickname?: Player["nickname"];
        } = {};

        if (shouldBackfillLoadout(existingData.loadout)) {
          playerPatch.loadout = normalizedLoadout;
        }

        if (!nickname) {
          if (Object.keys(playerPatch).length > 0) {
            transaction.set(playerRef, playerPatch, { merge: true });
          }

          return {
            player: existingPlayer,
            status: 200,
          };
        }

        const updatedPlayer = {
          ...existingPlayer,
          nickname,
        };

        transaction.set(
          playerRef,
          { ...playerPatch, nickname },
          { merge: true },
        );

        return {
          player: updatedPlayer,
          status: 200,
        };
      },
    );

    return NextResponse.json(
      { player: result.player },
      { status: result.status },
    );
  } catch (error) {
    console.error("Player API failed.", error);

    if (
      error instanceof Error &&
      error.message === "Firebase Admin credentials are not configured."
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Player request failed." },
      { status: 500 },
    );
  }
}
