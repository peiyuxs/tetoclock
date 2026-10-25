import { createHash } from "node:crypto";
import { isUuid } from "./api";
import { getDatabase } from "./db";

export async function authenticateDevice(
  request: Request,
  deviceId: string,
): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token || !isUuid(deviceId)) {
    return false;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const database = getDatabase();
  const [device] = await database`
    SELECT d.id
    FROM devices AS d
    JOIN device_tokens AS t ON t.device_id = d.id
    WHERE d.id = ${deviceId}::uuid
      AND d.revoked_at IS NULL
      AND t.token_hash = ${tokenHash}
      AND t.revoked_at IS NULL
    LIMIT 1
  `;

  if (!device) {
    return false;
  }

  await database`
    UPDATE devices
    SET last_seen_at = NOW()
    WHERE id = ${deviceId}::uuid
  `;
  return true;
}
