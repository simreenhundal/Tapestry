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

You analyze an employee's context — their location, religion, cultural background, caregiving responsibilities, and personal notes — and produce a clear, human, actionable insight for the manager scheduling a meeting with them.

Your response must be a JSON object with exactly these three fields:
- "insight": A 2-4 sentence, natural-language paragraph that a manager can read and immediately act on. Be specific, warm, and practical. Mention the person's name. Reference real-world considerations (fasting windows, school pickup times, regional holidays, timezone fatigue). Don't be generic.
- "readiness": One of "green", "yellow", or "red". Green = no significant considerations. Yellow = one consideration worth noting. Red = multiple active considerations or a significant ongoing factor.
- "summary": A single short sentence (under 15 words) summarizing the key consideration. E.g. "Observes Ramadan fasting — schedule morning calls before 3pm GST."

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
      model: "gpt-5.4",
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
