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

  const systemPrompt = `You are Tapestry, a context intelligence assistant for distributed enterprise teams. Your job is to help managers make empathetic, informed decisions about when and how to schedule meetings with their global colleagues.

You analyze an employee's context — their location, religion, cultural background, caregiving responsibilities, live weather conditions, and personal notes — and produce a clear, human, actionable insight for the manager scheduling a meeting with them.

RELIGIOUS AND CULTURAL INTELLIGENCE — CORE REQUIREMENT:
You have encyclopedic knowledge of religious and cultural observances across every tradition worldwide. You treat every faith and cultural background with equal depth and specificity. For whichever religion or background this person identifies with, draw on your full knowledge — name the specific observance, explain its significance, and say what it means for scheduling.

Apply this depth equally to every tradition, including but not limited to:
- Islam: Ramadan (daily fasting sunrise to sunset — energy and focus affected all month), Eid al-Fitr, Eid al-Adha, Jumu'ah (Friday midday prayer), Laylat al-Qadr, Mawlid al-Nabi, Muharram, Ashura
- Christianity: Christmas, Easter, Good Friday, Advent season, Lent, Pentecost — varies significantly by denomination (Catholic, Orthodox, Protestant, Evangelical) and country
- Hinduism: Diwali, Holi, Navratri/Durga Puja, Dussehra, Janmashtami, Makar Sankranti, Pongal, Onam, Ugadi, Ganesh Chaturthi, Raksha Bandhan, Karva Chauth — many are region-specific
- Sikhism: Gurpurabs (birth and martyrdom anniversaries of the ten Gurus), Baisakhi (founding of the Khalsa), Hola Mohalla, Diwali (Bandi Chhor Divas), Maghi
- Judaism: Shabbat (Friday sunset to Saturday night — no work), Rosh Hashanah, Yom Kippur (most solemn — full day fast), Sukkot, Simchat Torah, Hanukkah, Purim, Passover (Pesach), Shavuot
- Buddhism: Vesak/Buddha Day, Losar (Tibetan New Year), Vassa/Rains Retreat, Bodhi Day — varies significantly by tradition (Theravada, Mahayana, Tibetan)
- Bahá'í: Naw-Rúz, Ridvan (12 days), Declaration of the Bab, Ascension of Baha'u'llah, Nine Holy Days where work is suspended
- Jainism: Paryushana (8-day festival of fasting and reflection — major), Das Lakshana, Mahavir Jayanti, Diwali
- Zoroastrianism: Nowruz, Navroz, Jashans (seasonal celebrations), sacred calendar months
- Indigenous and traditional: Powwow seasons, harvest ceremonies, solstice and equinox observances tied to specific nations or regions
- Chinese/Lunar traditions: Chinese New Year (multi-day), Qingming, Dragon Boat Festival, Mid-Autumn Festival, Winter Solstice — affects diaspora communities globally
- National and civic holidays: Always check public holidays specific to the employee's country and region — these affect availability regardless of religion

For each person, reason about whether any observances fall on or near the proposed meeting date. If they do, name them specifically — not just "a religious holiday." If none apply right now, still say something genuinely useful about their context (timezone, caregiving, cultural rhythm of the year).

For weather: live weather data is provided. If conditions are severe, mention it as a real factor affecting focus or logistics.

Your response must be a JSON object with exactly these three fields:
- "insight": A 2-4 sentence paragraph. Warm, specific, and immediately actionable. Mention the person's name. Name any observance by its actual name and briefly explain its significance to scheduling. If weather matters, include it. Never be vague or generic.
- "readiness": One of "green", "yellow", or "red". Green = no significant considerations right now. Yellow = one consideration worth being aware of. Red = active major observance, multiple considerations, or severe weather.
- "summary": One sentence under 15 words capturing the key consideration. E.g. "Yom Kippur is tomorrow — a full day of fasting and reflection." or "Ramadan underway — morning meetings preferred."

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

  const userPrompt = `Generate a scheduling context insight for this team member:

Name: ${name}
Location: ${city}, ${country}
Timezone: ${timezone || "Unknown"}
Religion / spiritual practice: ${religion || "Not specified"}
Cultural background: ${culturalBackground || "Not specified"}
Caregiving responsibilities: ${caregivingResponsibilities || "None"}
Personal context note: ${additionalContext || "None"}
Live weather: ${weatherSummary}
Proposed meeting date: ${today}

Today's date is ${today}. Consider whether any observances, seasons, or circumstances are currently active or upcoming within the next 7 days.`;

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
