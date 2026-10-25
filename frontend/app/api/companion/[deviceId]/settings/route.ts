import { NextResponse } from "next/server";
import { authenticateDevice } from "../../../../../lib/device-auth";
import { errorResponse } from "../../../../../lib/api";
import { getDatabase } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ deviceId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { deviceId } = await params;
  if (!(await authenticateDevice(request, deviceId))) {
    return errorResponse("This companion is not paired to that clock.", 401);
  }

  const database = getDatabase();
  const [clock] = await database`
    SELECT
      d.id::text AS id,
      d.name,
      d.device_serial,
      s.song,
      s.message_mode,
      s.message,
      s.volume
    FROM devices AS d
    JOIN device_settings AS s ON s.device_id = d.id
    WHERE d.id = ${deviceId}::uuid
      AND d.revoked_at IS NULL
    LIMIT 1
  `;
  if (!clock) {
    return errorResponse("Clock not found.", 404);
  }

  return NextResponse.json({
    device: {
      id: clock.id,
      name: clock.name,
      deviceSerial: clock.device_serial,
    },
    settings: {
      song: clock.song,
      messageMode: clock.message_mode,
      message: clock.message,
      volume: clock.volume,
    },
  });
}
