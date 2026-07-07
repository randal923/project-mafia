import { NextResponse } from "next/server";
import { getAuthenticatedPlayer } from "../lib/getAuthenticatedPlayer";
import { JobsService } from "../../services/jobs";

export async function POST(request: Request) {
  try {
    const authenticatedPlayer = await getAuthenticatedPlayer(request);

    if (!authenticatedPlayer.ok) {
      return authenticatedPlayer.response;
    }

    return NextResponse.json({
      jobs: JobsService.createJobsForPlayer(authenticatedPlayer.data.player),
    });
  } catch (error) {
    console.error("Jobs API failed.", error);

    if (
      error instanceof Error &&
      error.message === "Firebase Admin credentials are not configured."
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Jobs request failed." },
      { status: 500 },
    );
  }
}
