import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { errorResponse, isRecord, readJson } from "../../../../lib/api";
import { getDatabase } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const code = isRecord(body) && typeof body.code === "string" ? body.code : "";
  const deviceSerial =
    isRecord(body) && typeof body.deviceSerial === "string" ? body.deviceSerial.trim() : "";
  if (!code || code.length > 128 || !deviceSerial || deviceSerial.length > 255) {
    return errorResponse("A valid pairing code and USB device serial are required.", 400);
  }

  const codeHash = createHash("sha256").update(code).digest("hex");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const database = getDatabase();

  const pairingResult = await database.begin(async (transaction) => {
    const [pairing] = await transaction`
      SELECT owner_user_id, device_name
      FROM device_pairing_codes
      WHERE code_hash = ${codeHash}
        AND used_at IS NULL
        AND expires_at > NOW()
      FOR UPDATE
    `;
    if (!pairing) {
      return { kind: "invalid" as const };
    }

    await transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${deviceSerial}, 0))
    `;
    const [existingClock] = await transaction`
      SELECT id::text AS id, owner_user_id
      FROM devices
      WHERE device_serial = ${deviceSerial}
        AND revoked_at IS NULL
      FOR UPDATE
    `;
    if (existingClock && existingClock.owner_user_id !== pairing.owner_user_id) {
      return { kind: "owned" as const };
    }

    if (existingClock) {
      await transaction`
        UPDATE devices
        SET name = ${pairing.device_name}, last_seen_at = NOW()
        WHERE id = ${existingClock.id}::uuid
      `;
      await transaction`
        INSERT INTO device_tokens (device_id, token_hash)
        VALUES (${existingClock.id}::uuid, ${tokenHash})
        ON CONFLICT (device_id) DO UPDATE
        SET token_hash = EXCLUDED.token_hash,
            revoked_at = NULL,
            created_at = NOW()
      `;
      await transaction`
        UPDATE device_pairing_codes
        SET used_at = NOW()
        WHERE code_hash = ${codeHash}
      `;
      return {
        kind: "paired" as const,
        clock: { id: existingClock.id, name: pairing.device_name },
      };
    }

    const [clock] = await transaction`
      INSERT INTO devices (owner_user_id, device_serial, name, last_seen_at)
      VALUES (
        ${pairing.owner_user_id},
        ${deviceSerial},
        ${pairing.device_name},
        NOW()
      )
      RETURNING id::text AS id, name
    `;

    await transaction`
      INSERT INTO device_settings (device_id)
      VALUES (${clock.id}::uuid)
    `;
    await transaction`
      INSERT INTO device_tokens (device_id, token_hash)
      VALUES (${clock.id}::uuid, ${tokenHash})
    `;
    await transaction`
      UPDATE device_pairing_codes
      SET used_at = NOW()
      WHERE code_hash = ${codeHash}
    `;

    return { kind: "paired" as const, clock };
  });

  if (pairingResult.kind === "invalid") {
    return errorResponse("This pairing code is invalid, expired, or already used.", 410);
  }
  if (pairingResult.kind === "owned") {
    return errorResponse("This USB clock is already paired to another account.", 409);
  }

  return NextResponse.json({
    deviceId: pairingResult.clock.id,
    deviceName: pairingResult.clock.name,
    deviceToken: token,
  });
}
