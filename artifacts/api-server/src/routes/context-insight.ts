import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateContextInsightBody, GenerateContextInsightResponse } from "@workspace/api-zod";
import { db, employeesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function fetchWeather(city: string, country: string): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return "Weather data unavailable.";

  try {
    const query = `${city},${country}`;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) return "Weather data unavailable.";

    const data = await res.json() as {
      weather: { description: string }[];
      main: { temp: number; feels_like: number; humidity: number };
      wind: { speed: number };
      alerts?: { event: string; description: string }[];
    };

    const desc = data.weather[0]?.description ?? "unknown";
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const wind = data.wind.speed;

    let weatherStr = `Current conditions in ${city}: ${desc}, ${temp}°C (feels like ${feelsLike}°C), wind ${wind} m/s.`;

    if (data.alerts && data.alerts.length > 0) {
      const alertNames = data.alerts.map((a) => a.event).join(", ");
      weatherStr += ` Active weather alerts: ${alertNames}.`;
    }

    const severe = ["thunderstorm", "blizzard", "tornado", "hurricane", "heavy snow", "freezing", "ice", "sleet", "heavy rain", "extreme"];
    const isSevere = severe.some((s) => desc.toLowerCase().includes(s));
    if (isSevere) {
      weatherStr += " ⚠️ Severe weather conditions detected.";
    }

    return weatherStr;
  } catch (err) {
    logger.warn({ err }, "Failed to fetch weather");
    return "Weather data unavailable.";
  }
}

function getLocalTime(meetingDatetime: string, timezone: string): string {
  try {
    const date = new Date(meetingDatetime);
    return date.toLocaleString("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return meetingDatetime;
  }
}

const systemPrompt = `You are Tapestry, a context intelligence assistant for distributed enterprise teams.

Your job is to answer one question for the meeting organizer: "Is this a good time to meet with this person?"

You are given a snapshot of who this person is (their religion, cultural background, caregiving situation, work schedule preferences, health considerations, location) plus live conditions at the moment of the proposed meeting (the exact datetime, day of week, and real-time weather in their city). Use the baseline profile as context — but your output must be about what is happening ON THIS SPECIFIC DATE AND TIME, not general background information.

RULES FOR DATE-SPECIFIC REASONING:
- Do NOT say "they observe Ramadan from February to March." Say "It is currently Ramadan today" — or if it is not active on this date, do not mention it at all.
- Do NOT list general facts about a religion. Reason: is any observance ACTIVE or IMMINENT on the exact date provided?
- Day of week matters: Friday = Jumu'ah prayer for Muslims (midday unavailability), Friday sunset through Saturday night = Shabbat for Jewish people (no work). Saturday and Sunday are rest days for many Christian traditions.
- Work hours matter: if the meeting falls outside the person's stated preferred work hours, flag it clearly.
- If a major observance falls today or within 2 days of the meeting date, flag it by name and say what it means right now.
- If no observance is active or imminent, say so briefly and move on to other real factors (weather, caregiving timing, timezone, work schedule).

WEATHER AS A PRODUCTIVITY SIGNAL:
- Live weather is provided for this person's city at the time of booking.
- Severe or disruptive weather is a real productivity factor. Mention it directly.
- Disruptions that matter: thunderstorms, heavy snow or blizzards, freezing rain, high winds, extreme heat above 38°C, active weather alerts. Light rain or mild overcast — no need to mention.

OUTPUT FORMAT — JSON only, two fields:
- "signal": "green" (clear — good time to meet), "yellow" (one consideration worth knowing), or "red" (active major observance today, severe weather, meeting outside work hours, or multiple real factors)
- "reason": 2-3 sentences. Direct and warm. Mention the person's name. Lead with what matters TODAY. If it's a clear period, say so plainly and note something practical (best meeting window, timezone context, etc.).

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

router.post("/context-insight", async (req, res): Promise<void> => {
  const parsed = GenerateContextInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { employeeIds, meetingDatetime } = parsed.data;

  const employees = await db
    .select()
    .from(employeesTable)
    .where(inArray(employeesTable.id, employeeIds));

  if (employees.length === 0) {
    res.status(404).json({ error: "No employees found for given IDs" });
    return;
  }

  const meetingDate = new Date(meetingDatetime);
  const dayOfWeek = meetingDate.toLocaleDateString("en-US", { weekday: "long" });
  const fullDateLabel = meetingDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeLabel = meetingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const attendeeResults = await Promise.all(
    employees.map(async (employee) => {
      const weatherSummary = await fetchWeather(employee.city, employee.country);
      const localTime = getLocalTime(meetingDatetime, employee.timezone);

      const userPrompt = `Should the meeting organizer schedule a meeting with this team member at the specified time?

Name: ${employee.name}
Role: ${employee.role || "Not specified"}
Location: ${employee.city}, ${employee.country}
Timezone: ${employee.timezone || "Unknown"}
Local time of proposed meeting: ${localTime}
Preferred work hours: ${employee.preferredWorkStart || "09:00"} – ${employee.preferredWorkEnd || "17:00"} (${Array.isArray(employee.preferredWorkDays) && employee.preferredWorkDays.length > 0 ? employee.preferredWorkDays.join(", ") : "Mon–Fri"})
Religion / spiritual practice: ${employee.religion || "Not specified"}
Cultural background: ${employee.culturalBackground || "Not specified"}
Caregiving responsibilities: ${employee.caregivingResponsibilities || "None"}
Health considerations: ${employee.healthConsiderations || "None"}
Personal notes: ${employee.additionalContext || "None"}

MEETING DATE: ${fullDateLabel}
MEETING TIME: ${timeLabel} UTC
DAY OF WEEK: ${dayOfWeek}
LIVE WEATHER RIGHT NOW in ${employee.city}: ${weatherSummary}

Reason specifically against this date/time and these live conditions. Do not give general background.`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          max_completion_tokens: 300,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        let aiResult: { signal?: string; reason?: string };
        try {
          aiResult = JSON.parse(content);
        } catch {
          aiResult = {};
        }

        const signal = ["green", "yellow", "red"].includes(aiResult.signal ?? "")
          ? (aiResult.signal as "green" | "yellow" | "red")
          : "green";

        return {
          employeeId: employee.id,
          name: employee.name,
          city: employee.city,
          timezone: employee.timezone,
          localTime,
          signal,
          reason: aiResult.reason ?? "No insight generated.",
        };
      } catch (err) {
        logger.error({ err, employeeId: employee.id }, "Failed to generate insight for employee");
        return {
          employeeId: employee.id,
          name: employee.name,
          city: employee.city,
          timezone: employee.timezone,
          localTime,
          signal: "yellow" as const,
          reason: "Unable to generate insight at this time.",
        };
      }
    })
  );

  const signalOrder = { red: 0, yellow: 1, green: 2 };
  const aggregateSignal = attendeeResults.reduce<"green" | "yellow" | "red">((worst, a) => {
    return signalOrder[a.signal] < signalOrder[worst] ? a.signal : worst;
  }, "green");

  const redCount = attendeeResults.filter((a) => a.signal === "red").length;
  const yellowCount = attendeeResults.filter((a) => a.signal === "yellow").length;
  const greenCount = attendeeResults.filter((a) => a.signal === "green").length;

  let recommendation: string;
  if (aggregateSignal === "green") {
    recommendation = `This looks like a good time to meet. All ${greenCount} attendee${greenCount !== 1 ? "s" : ""} show a clear schedule with no active conflicts.`;
  } else if (aggregateSignal === "yellow") {
    recommendation = `Proceed with awareness. ${yellowCount} attendee${yellowCount !== 1 ? "s have" : " has"} considerations worth noting — the meeting can likely go ahead but may benefit from flexibility.`;
  } else {
    recommendation = `Consider rescheduling. ${redCount} attendee${redCount !== 1 ? "s have" : " has"} a significant conflict (active observance, severe weather, or out-of-hours scheduling). See individual readiness cards for details.`;
  }

  const alternatives: string[] = [];
  if (aggregateSignal !== "green") {
    const meetingHour = meetingDate.getUTCHours();
    if (meetingHour < 14) {
      alternatives.push("Try 14:00 UTC — typically within business hours for both European and Asian timezones.");
    } else {
      alternatives.push("Try 10:00 UTC — a common overlap window for EMEA and Americas teams.");
    }
    alternatives.push("Consider scheduling 48 hours later to clear any active observance windows.");
    alternatives.push("Poll attendees async for their preferred time windows this week.");
  }

  const result = GenerateContextInsightResponse.parse({
    attendees: attendeeResults,
    aggregateSignal,
    recommendation,
    alternatives,
  });

  req.log.info({ employeeCount: employees.length, aggregateSignal }, "Meeting readiness report generated");
  res.json(result);
});

export default router;
