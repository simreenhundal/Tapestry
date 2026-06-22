import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { GenerateContextInsightBody, GenerateContextInsightResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

  const systemPrompt = `You are Tapestry, a context intelligence assistant for distributed enterprise teams. Your job is to help managers make empathetic, informed decisions about when and how to schedule meetings with their global colleagues.

You analyze an employee's context — their location, religion, cultural background, caregiving responsibilities, weather conditions, and personal notes — and produce a clear, human, actionable insight for the manager scheduling a meeting with them.

IMPORTANT — Cultural and Religious Intelligence:
You must demonstrate deep, specific knowledge of religious and cultural observances across ALL traditions, not just the most common ones. Examples of what you must actively consider and surface:
- Sikhism: Gurpurab (anniversaries of Sikh Gurus), Baisakhi (harvest festival, also marks the founding of the Khalsa — major Sikh holiday), Diwali as celebrated by Sikhs, Hola Mohalla, days of significance at Harmandir Sahib. If someone identifies as Punjabi Sikh, actively check whether any Gurpurabs or major Sikh observances fall near the proposed meeting date.
- Islam: Ramadan fasting windows, Eid al-Fitr, Eid al-Adha, Jumu'ah (Friday prayer — affects Friday afternoon availability), Laylat al-Qadr
- Judaism: Shabbat (Friday sunset to Saturday night), High Holidays (Rosh Hashanah, Yom Kippur), Passover, Sukkot
- Hinduism: Diwali, Holi, Navratri, regional festivals specific to their background
- Christianity: Christmas, Good Friday, Easter — varies by denomination and region
- Indigenous and regional observances relevant to their country/region
- National and civic holidays specific to their country (Canada, India, UAE, Nigeria, UK, etc.)

For weather: if weather data is provided, consider how it affects the employee. A major snowstorm, extreme heat, or severe weather event may affect focus, commute, power, or stress levels even if the person can technically attend a meeting.

Your response must be a JSON object with exactly these three fields:
- "insight": A 2-4 sentence, natural-language paragraph that a manager can read and immediately act on. Be specific, warm, and culturally informed. Mention the person's name. Reference the actual observance by name (e.g. "Gurpurab commemorating Guru Nanak Dev Ji's birthday" not just "a religious holiday"). If there are no active considerations, still say something genuinely useful about their context. Don't be generic.
- "readiness": One of "green", "yellow", or "red". Green = no significant considerations. Yellow = one consideration worth noting. Red = multiple active considerations or a significant ongoing factor (active observance, severe weather, multiple flags).
- "summary": A single short sentence (under 15 words) summarizing the key consideration. E.g. "Baisakhi falls this week — a significant Sikh celebration." or "Snowstorm warning in Toronto today."

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

  const userPrompt = `Generate a scheduling context insight for this team member:

Name: ${name}
Location: ${city}, ${country}
Timezone: ${timezone || "Unknown"}
Religion / spiritual practice: ${religion || "Not specified"}
Cultural background: ${culturalBackground || "Not specified"}
Caregiving responsibilities: ${caregivingResponsibilities || "None"}
Personal context note: ${additionalContext || "None"}
Proposed meeting date: ${today}

Today's date is ${today}. Consider whether any observances, seasons, or circumstances are currently active or upcoming.`;

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

    res.json(result);
  } catch (error) {
    logger.error({ error }, "Error calling OpenAI");
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

export default router;
