import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { errorResponse, getSignedInUserId, isRecord, readJson } from "../../../lib/api";
import { getDatabase } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in to view your clocks.", 401);
  }

  const database = getDatabase();
  const clocks = await database`
    SELECT
      d.id::text AS id,
      d.name,
      d.device_serial,
      d.created_at,
      d.last_seen_at,
      s.song,
      s.message_mode,
      s.message,
      s.volume
    FROM devices AS d
    LEFT JOIN device_settings AS s ON s.device_id = d.id
    WHERE d.owner_user_id = ${userId}
      AND d.revoked_at IS NULL
    ORDER BY d.created_at ASC
  `;

  return NextResponse.json({
    clocks: clocks.map((clock) => ({
      id: clock.id,
      name: clock.name,
      deviceSerial: clock.device_serial,
      createdAt: clock.created_at,
      lastSeenAt: clock.last_seen_at,
      settings: clock.song
        ? {
            song: clock.song,
            messageMode: clock.message_mode,
            message: clock.message,
            volume: clock.volume,
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) {
    return errorResponse("Sign in before adding a clock.", 401);
  }

  const body = await readJson(request);
  const name = isRecord(body) && typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return errorResponse("Enter a clock name between 1 and 60 characters.", 400);
  }

  const pairingCode = randomBytes(24).toString("base64url");
  const codeHash = createHash("sha256").update(pairingCode).digest("hex");
  const database = getDatabase();
  const [pairing] = await database`
    INSERT INTO device_pairing_codes (code_hash, owner_user_id, device_name, expires_at)
    VALUES (${codeHash}, ${userId}, ${name}, NOW() + INTERVAL '10 minutes')
    RETURNING expires_at
  `;

  return NextResponse.json(
    {
      pairingCode,
      expiresAt: pairing.expires_at,
    },
    { status: 201 },
  );
}
