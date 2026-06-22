// Google Calendar via Replit Connectors SDK
// Uses connectors.proxy("google-calendar", ...) — auth is handled automatically
import { ReplitConnectors } from "@replit/connectors-sdk";

export interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string; self?: boolean }[];
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const connectors = new ReplitConnectors();
    const res = await connectors.proxy("google-calendar", "/users/me/calendarList?maxResults=1", {
      method: "GET",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchGoogleCalendarEvents(hoursAhead: number): Promise<GoogleEvent[]> {
  const connectors = new ReplitConnectors();

  const now = new Date().toISOString();
  const later = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: later,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await connectors.proxy(
    "google-calendar",
    `/calendars/primary/events?${params}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { items?: GoogleEvent[] };
  return data.items ?? [];
}
