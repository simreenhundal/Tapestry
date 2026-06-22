import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateContextInsightBody, GenerateContextInsightResponse } from "@workspace/api-zod";
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

    // Flag severe conditions
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

router.post("/context-insight", async (req, res): Promise<void> => {
  const parsed = GenerateContextInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    name,
    city,
    country,
    timezone,
    religion,
    culturalBackground,
    caregivingResponsibilities,
    additionalContext,
    meetingDate,
  } = parsed.data;

  const today = meetingDate || new Date().toISOString().split("T")[0];

  // Fetch live weather in parallel with building the prompt
  const weatherSummary = await fetchWeather(city, country);

  const meetingDateObj = new Date(today);
  const dayOfWeek = meetingDateObj.toLocaleDateString("en-US", { weekday: "long" });
  const fullDateLabel = meetingDateObj.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are Tapestry, a context intelligence assistant for distributed enterprise teams.

Your job is to answer one question for the manager: "Is right now a good time to meet with this person?"

You are given a snapshot of who this person is (their religion, cultural background, caregiving situation, location) plus live conditions at the moment the manager is trying to book (the exact date, day of week, and real-time weather in their city). Use the baseline profile as context — but your output must be about what is happening ON THIS SPECIFIC DATE, not general background information.

RULES FOR DATE-SPECIFIC REASONING:
- Do NOT say "they observe Ramadan from February to March." Say "It is currently Ramadan today" — or if it is not active on this date, do not mention it at all.
- Do NOT list general facts about a religion. Reason: is any observance ACTIVE or IMMINENT on the exact date provided? Check the date against the real calendar.
- Day of week matters: Friday = Jumu'ah prayer for Muslims (midday unavailability), Friday sunset through Saturday night = Shabbat for Jewish people (no work). Saturday and Sunday are rest days for many Christian traditions. Use the day of week provided.
- If a major observance falls today or within 2 days of the meeting date, flag it by name and say what it means right now.
- If no observance is active or imminent, say so briefly and move on to other real factors (weather, caregiving timing, timezone).

WEATHER AS A PRODUCTIVITY SIGNAL:
- Live weather is provided for this person's city at the time of booking.
- Even if someone appears online, severe or disruptive weather is a real productivity factor. Mention it directly: "There is currently a severe thunderstorm in [city] — even if [name] is online, their focus and connectivity may be affected."
- Disruptions that matter: thunderstorms, heavy snow or blizzards, freezing rain, high winds, extreme heat above 38°C, active weather alerts. Light rain or mild overcast — no need to mention.
- Frame it as the manager would want to hear it: "This might not be the best moment for a high-stakes meeting."

TRADITIONS TO APPLY THIS DATE-SPECIFIC REASONING TO (equally):
Islam, Christianity (all denominations), Hinduism (region-specific), Sikhism, Judaism, Buddhism, Bahá'í, Jainism, Zoroastrianism, Indigenous traditions, Chinese/Lunar calendar, and national public holidays for the employee's country.

OUTPUT FORMAT — JSON only, three fields:
- "insight": 2-3 sentences. Direct and warm. Mention the person's name. Lead with what matters TODAY. If it's a quiet period — say that plainly and note something practical (best meeting window given timezone, caregiving schedule, etc.). Never pad with generic cultural background.
- "readiness": "green" (clear — good time to meet), "yellow" (one consideration worth knowing), or "red" (active major observance today, severe weather, or multiple real factors — meeting likely unproductive or disrespectful to schedule).
- "summary": One sentence, under 15 words. Should read like a status line a manager glances at. E.g. "It is currently Ramadan — fasting may affect afternoon energy." or "Severe thunderstorm in Lagos right now." or "Clear — good window to meet."

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

  const userPrompt = `Should the manager book a meeting with this team member on the date below?

Name: ${name}
Location: ${city}, ${country}
Timezone: ${timezone || "Unknown"}
Religion / spiritual practice: ${religion || "Not specified"}
Cultural background: ${culturalBackground || "Not specified"}
Caregiving responsibilities: ${caregivingResponsibilities || "None"}
Personal notes: ${additionalContext || "None"}

MEETING DATE: ${fullDateLabel} (${today})
DAY OF WEEK: ${dayOfWeek}
LIVE WEATHER RIGHT NOW in ${city}: ${weatherSummary}

Reason specifically against this date and these live conditions. Do not give general background — answer whether right now is a good time.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";

    let parsed2: { insight?: string; readiness?: string; summary?: string };
    try {
      parsed2 = JSON.parse(content);
    } catch {
      logger.error("Failed to parse OpenAI response as JSON");
      res.status(500).json({ error: "Failed to generate insight" });
      return;
    }

    const result = GenerateContextInsightResponse.parse({
      insight: parsed2.insight ?? "No insight generated.",
      readiness: ["green", "yellow", "red"].includes(parsed2.readiness ?? "")
        ? parsed2.readiness
        : "green",
      summary: parsed2.summary ?? "",
    });

    req.log.info({ name, city, country, readiness: result.readiness }, "Context insight generated");
    res.json(result);
  } catch (error) {
    logger.error({ error }, "Error calling OpenAI");
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

export default router;
