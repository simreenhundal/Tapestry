import { logger } from "./logger";

export async function getConnectorToken(connectionId: string): Promise<string | null> {
  const host = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const identity = process.env.REPL_IDENTITY;

  if (!host || !identity || !connectionId) return null;

  try {
    const res = await fetch(
      `https://${host}/api/v2/connection/${connectionId}/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `replit-v2 ${identity}`,
        },
      }
    );
    if (!res.ok) {
      logger.warn({ status: res.status, connectionId }, "Connector token fetch failed");
      return null;
    }
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch (err) {
    logger.warn({ err, connectionId }, "Connector token fetch error");
    return null;
  }
}
