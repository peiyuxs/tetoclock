import { NextResponse } from "next/server";
import { errorResponse, getSignedInUserId, isRecord, isUuid, readJson } from "../../../../lib/api";
import { getDatabase } from "../../../../lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!isUuid(deviceId)) {
    return errorResponse("Clock not found.", 404);
  }
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in to rename your clock.", 401);
  }

  const body = await readJson(request);
  const name = isRecord(body) && typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return errorResponse("Enter a clock name between 1 and 60 characters.", 400);
  }

  const database = getDatabase();
  const [clock] = await database`
    UPDATE devices
    SET name = ${name}
    WHERE id = ${deviceId}::uuid
      AND owner_user_id = ${userId}
      AND revoked_at IS NULL
    RETURNING id::text AS id, name
  `;
  if (!clock) {
    return errorResponse("Clock not found.", 404);
  }

  return NextResponse.json({ clock });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!isUuid(deviceId)) {
    return errorResponse("Clock not found.", 404);
  }
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in to remove your clock.", 401);
  }

  const database = getDatabase();
  const [clock] = await database`
    UPDATE devices
    SET revoked_at = NOW()
    WHERE id = ${deviceId}::uuid
      AND owner_user_id = ${userId}
      AND revoked_at IS NULL
    RETURNING id
  `;
  if (!clock) {
    return errorResponse("Clock not found.", 404);
  }

  await database`
    UPDATE device_tokens
    SET revoked_at = NOW()
    WHERE device_id = ${deviceId}::uuid
      AND revoked_at IS NULL
  `;

  return NextResponse.json({ removed: true });
}
