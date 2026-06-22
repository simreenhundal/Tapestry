import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db/schema";
import { getConnectorToken } from "../lib/replit-connector";
import { fetchGoogleCalendarEvents } from "../lib/google-calendar";
import { fetchMicrosoftCalendarEvents } from "../lib/microsoft-graph";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const GOOGLE_CONNECTION_ID = process.env.GOOGLE_CALENDAR_CONNECTION_ID ?? "";
const MICROSOFT_CONNECTION_ID = process.env.MICROSOFT_CALENDAR_CONNECTION_ID ?? "";

router.get("/calendar/status", async (_req, res): Promise<void> => {
  const [googleToken, microsoftToken] = await Promise.all([
    GOOGLE_CONNECTION_ID ? getConnectorToken(GOOGLE_CONNECTION_ID) : Promise.resolve(null),
    MICROSOFT_CONNECTION_ID ? getConnectorToken(MICROSOFT_CONNECTION_ID) : Promise.resolve(null),
  ]);

  res.json({
    google: googleToken !== null,
    microsoft: microsoftToken !== null,
  });
});

router.get("/calendar/meetings", async (req, res): Promise<void> => {
  const hoursAhead = Math.min(Number(req.query.hoursAhead ?? 48), 168);

  const [googleToken, microsoftToken] = await Promise.all([
    GOOGLE_CONNECTION_ID ? getConnectorToken(GOOGLE_CONNECTION_ID) : Promise.resolve(null),
    MICROSOFT_CONNECTION_ID ? getConnectorToken(MICROSOFT_CONNECTION_ID) : Promise.resolve(null),
  ]);

  if (!googleToken && !microsoftToken) {
    res.status(503).json({ error: "No calendar connected", connected: false });
    return;
  }

  const employees = await db.select().from(employeesTable);
  const emailToEmployee = new Map(employees.map((e) => [e.email.toLowerCase(), e]));

  type Attendee = { email: string; name: string };
  type Meeting = {
    id: string;
    title: string;
    start: string;
    end: string;
    provider: "google" | "microsoft";
    attendees: Attendee[];
    matchedEmployees: typeof employees;
  };

  const meetings: Meeting[] = [];

  if (googleToken) {
    try {
      const events = await fetchGoogleCalendarEvents(googleToken, hoursAhead);
      for (const event of events) {
        const attendees: Attendee[] = (event.attendees ?? []).map((a) => ({
          email: a.email,
          name: a.displayName ?? a.email,
        }));
        const matchedEmployees = attendees
          .map((a) => emailToEmployee.get(a.email.toLowerCase()))
          .filter((e): e is (typeof employees)[number] => e !== undefined);

        meetings.push({
          id: event.id,
          title: event.summary ?? "(No title)",
          start: event.start?.dateTime ?? event.start?.date ?? "",
          end: event.end?.dateTime ?? event.end?.date ?? "",
          provider: "google",
          attendees,
          matchedEmployees,
        });
      }
    } catch (err) {
      logger.error({ err }, "Google Calendar fetch failed");
    }
  }

  if (microsoftToken) {
    try {
      const events = await fetchMicrosoftCalendarEvents(microsoftToken, hoursAhead);
      for (const event of events) {
        const attendees: Attendee[] = (event.attendees ?? []).map((a) => ({
          email: a.emailAddress.address,
          name: a.emailAddress.name ?? a.emailAddress.address,
        }));
        const matchedEmployees = attendees
          .map((a) => emailToEmployee.get(a.email.toLowerCase()))
          .filter((e): e is (typeof employees)[number] => e !== undefined);

        meetings.push({
          id: event.id ?? "",
          title: event.subject ?? "(No title)",
          start: event.start?.dateTime ?? "",
          end: event.end?.dateTime ?? "",
          provider: "microsoft",
          attendees,
          matchedEmployees,
        });
      }
    } catch (err) {
      logger.error({ err }, "Microsoft Calendar fetch failed");
    }
  }

  meetings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const provider = googleToken ? "google" : "microsoft";
  res.json({ meetings, provider });
});

export default router;
