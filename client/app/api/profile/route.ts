import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdminApp } from "../../firebase/getFirebaseAdminApp";
import { createDefaultProfile } from "../../profile/lib/createDefaultProfile";
import type { Profile } from "../../profile/lib/profileModel";

type ProfileWriteResult = {
  profile: Profile;
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
        { error: "Profile request body must be an object." },
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

    const profileFallback = createDefaultProfile({
      name:
        decodedToken.name ??
        decodedToken.email ??
        `Player ${decodedToken.uid.slice(0, 6)}`,
    });
    const firestore = getFirestore(adminApp);
    const profileRef = firestore.collection("profiles").doc(decodedToken.uid);
    const result = await firestore.runTransaction<ProfileWriteResult>(
      async (transaction) => {
        const profileSnapshot = await transaction.get(profileRef);

        if (!profileSnapshot.exists) {
          const createdProfile = {
            ...profileFallback,
            nickname: nickname ?? "",
          };

          transaction.set(profileRef, createdProfile);

          return {
            profile: createdProfile,
            status: 201,
          };
        }

        const existingProfile = {
          ...profileFallback,
          ...(profileSnapshot.data() as Partial<Profile> | undefined),
        };

        if (!nickname) {
          return {
            profile: existingProfile,
            status: 200,
          };
        }

        const updatedProfile = {
          ...existingProfile,
          nickname,
        };

        transaction.set(profileRef, { nickname }, { merge: true });

        return {
          profile: updatedProfile,
          status: 200,
        };
      },
    );

    return NextResponse.json(
      { profile: result.profile },
      { status: result.status },
    );
  } catch (error) {
    console.error("Profile API failed.", error);

    if (
      error instanceof Error &&
      error.message === "Firebase Admin credentials are not configured."
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Profile request failed." },
      { status: 500 },
    );
  }
}
