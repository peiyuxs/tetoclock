import { NextResponse } from "next/server";
import { errorResponse, getSignedInUserId, isUuid } from "../../../../../lib/api";
import { getDatabase } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!isUuid(deviceId)) {
    return errorResponse("Clock not found.", 404);
  }
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in to view clock history.", 401);
  }

  const database = getDatabase();
  const [clock] = await database`
    SELECT id
    FROM devices
    WHERE id = ${deviceId}::uuid
      AND owner_user_id = ${userId}
      AND revoked_at IS NULL
    LIMIT 1
  `;
  if (!clock) {
    return errorResponse("Clock not found.", 404);
  }

  const range = new URL(request.url).searchParams.get("range");
  const sessions =
    range === "7days"
      ? await database`
          SELECT
            session_id::text AS id,
            time AS dismissed_at,
            alarm_started_at,
            response_ms
          FROM alarm_sessions
          WHERE device_id = ${deviceId}::uuid
            AND time >= NOW() - INTERVAL '7 days'
          ORDER BY time DESC
          LIMIT 100
        `
      : await database`
          SELECT
            session_id::text AS id,
            time AS dismissed_at,
            alarm_started_at,
            response_ms
          FROM alarm_sessions
          WHERE device_id = ${deviceId}::uuid
          ORDER BY time DESC
          LIMIT 12
        `;
  return NextResponse.json({ sessions });
}
