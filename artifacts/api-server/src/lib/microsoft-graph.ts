export interface GraphEvent {
  id: string;
  subject?: string;
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  attendees?: { emailAddress: { address: string; name?: string } }[];
}

export async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  hoursAhead: number
): Promise<GraphEvent[]> {
  const now = new Date().toISOString();
  const later = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

  const filter = `start/dateTime ge '${now}' and start/dateTime le '${later}'`;
  const params = new URLSearchParams({
    $filter: filter,
    $orderby: "start/dateTime",
    $top: "20",
    $select: "id,subject,start,end,attendees",
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft Graph API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { value: GraphEvent[] };
  return data.value ?? [];
}
