import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdminApp } from "../../firebase/getFirebaseAdminApp";
import type { Player } from "../../models/player";
import { createDefaultPlayer } from "../../player/lib/createDefaultPlayer";
import {
  normalizeLoadout,
  shouldBackfillLoadout,
} from "../../player/lib/playerLoadoutDefaults";

type AuthenticatedPlayerData = {
  decodedToken: DecodedIdToken;
  player: Player;
  uid: string;
};

type AuthenticatedPlayerSuccess = {
  data: AuthenticatedPlayerData;
  ok: true;
};

type AuthenticatedPlayerFailure = {
  ok: false;
  response: Response;
};

export type AuthenticatedPlayerResult =
  | AuthenticatedPlayerFailure
  | AuthenticatedPlayerSuccess;

export async function getAuthenticatedPlayer(
  request: Request,
): Promise<AuthenticatedPlayerResult> {
  const authorizationHeader = request.headers.get("authorization") ?? "";
  const idToken = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : "";

  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "A Firebase ID token is required." },
        { status: 401 },
      ),
    };
  }

  const adminApp = getFirebaseAdminApp();
  let decodedToken: DecodedIdToken;

  try {
    decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Firebase sign in could not be verified." },
        { status: 401 },
      ),
    };
  }

  const firestore = getFirestore(adminApp);
  const playerRef = firestore.collection("players").doc(decodedToken.uid);
  const playerFallback = createDefaultPlayer({
    name:
      decodedToken.name ??
      decodedToken.email ??
      `Player ${decodedToken.uid.slice(0, 6)}`,
  });
  const player = await firestore.runTransaction<Player>(async (transaction) => {
    const playerSnapshot = await transaction.get(playerRef);

    if (!playerSnapshot.exists) {
      transaction.set(playerRef, playerFallback);

      return playerFallback;
    }

    const existingData = playerSnapshot.data() as Player;
    const normalizedLoadout = normalizeLoadout(existingData.loadout);
    const existingPlayer = {
      ...existingData,
      loadout: normalizedLoadout,
    };

    if (shouldBackfillLoadout(existingData.loadout)) {
      transaction.set(
        playerRef,
        { loadout: normalizedLoadout },
        { merge: true },
      );
    }

    return existingPlayer;
  });

  return {
    data: {
      decodedToken,
      player,
      uid: decodedToken.uid,
    },
    ok: true,
  };
}
