export interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string }[];
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  hoursAhead: number
): Promise<GoogleEvent[]> {
  const now = new Date().toISOString();
  const later = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin: now,
    timeMax: later,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "20",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { items: GoogleEvent[] };
  return data.items ?? [];
}
