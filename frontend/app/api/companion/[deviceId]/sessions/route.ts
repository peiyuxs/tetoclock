import { NextResponse } from "next/server";
import { errorResponse, isRecord, isUuid, readJson } from "../../../../../lib/api";
import { authenticateDevice } from "../../../../../lib/device-auth";
import { getDatabase } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!(await authenticateDevice(request, deviceId))) {
    return errorResponse("This companion is not paired to that clock.", 401);
  }

  const body = await readJson(request);
  const sessionId = isRecord(body) && typeof body.sessionId === "string" ? body.sessionId : "";
  const startedAt = isRecord(body) && typeof body.startedAt === "string" ? new Date(body.startedAt) : null;
  const dismissedAt =
    isRecord(body) && typeof body.dismissedAt === "string" ? new Date(body.dismissedAt) : null;

  if (
    !isUuid(sessionId) ||
    !startedAt ||
    !dismissedAt ||
    Number.isNaN(startedAt.getTime()) ||
    Number.isNaN(dismissedAt.getTime())
  ) {
    return errorResponse("A session ID and valid alarm start and dismissal times are required.", 400);
  }

  const responseMs = dismissedAt.getTime() - startedAt.getTime();
  if (responseMs < 0 || responseMs > 120_000) {
    return errorResponse("Alarm response time must be between 0 and 120 seconds.", 400);
  }

  const database = getDatabase();
  const [session] = await database`
    INSERT INTO alarm_sessions (
      time,
      session_id,
      device_id,
      alarm_started_at,
      dismissed_at,
      response_ms
    )
    SELECT
      ${dismissedAt.toISOString()}::timestamptz,
      ${sessionId}::uuid,
      d.id,
      ${startedAt.toISOString()}::timestamptz,
      ${dismissedAt.toISOString()}::timestamptz,
      ${responseMs}
    FROM devices AS d
    WHERE d.id = ${deviceId}::uuid
      AND d.revoked_at IS NULL
    ON CONFLICT (time, session_id) DO UPDATE
    SET response_ms = EXCLUDED.response_ms
    RETURNING session_id::text AS id, time AS dismissed_at, response_ms
  `;
  if (!session) {
    return errorResponse("Clock not found.", 404);
  }

  return NextResponse.json({ session }, { status: 201 });
}
