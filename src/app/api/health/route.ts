import { NextResponse } from "next/server";

/**
 * Health check endpoint for production monitoring
 * Returns JSON with status and timestamp
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: Date.now(),
      status: "healthy",
    },
    { status: 200 }
  );
}
