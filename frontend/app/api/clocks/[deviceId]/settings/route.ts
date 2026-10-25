import { NextResponse } from "next/server";
import { errorResponse, getSignedInUserId, isUuid, readJson } from "../../../../../lib/api";
import { getDatabase } from "../../../../../lib/db";
import { parseSettings } from "../../../../../lib/settings";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!isUuid(deviceId)) {
    return errorResponse("Clock not found.", 404);
  }
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in to save clock settings.", 401);
  }

  const settings = parseSettings(await readJson(request));
  if (!settings) {
    return errorResponse("Check the alarm song, message, message type, and volume.", 400);
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

  await database`
    INSERT INTO device_settings (device_id, song, message_mode, message, volume, updated_at)
    VALUES (
      ${deviceId}::uuid,
      ${settings.song},
      ${settings.messageMode},
      ${settings.message},
      ${settings.volume},
      NOW()
    )
    ON CONFLICT (device_id) DO UPDATE
    SET song = EXCLUDED.song,
        message_mode = EXCLUDED.message_mode,
        message = EXCLUDED.message,
        volume = EXCLUDED.volume,
        updated_at = NOW()
  `;

  return NextResponse.json({ settings });
}
