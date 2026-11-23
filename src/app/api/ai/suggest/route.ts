/**
 * POST /api/ai/suggest: Planzy Scout place suggestions.
 *
 * With ANTHROPIC_API_KEY set on the server, Claude reads the request and the
 * place catalogue and picks the places, with a reason for each. Without a key,
 * or if the call fails, the built-in engine answers instead, so the feature
 * always works. The key never reaches the browser.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getPlace } from "@/lib/api/data";
import {
  byDistance,
  catalogue,
  describe,
  fit,
  kmFrom,
  suggestLocally,
  understand,
  type AiQuery,
  type AiResult,
} from "@/lib/ai/suggest";
import { CATEGORIES } from "@/lib/api/data";
import type { Category } from "@/lib/types";

const MODEL = "claude-opus-5-5";

const SYSTEM = `You are Planzy Scout, the place finder inside Planzy, an app for planning group outings in Ahmedabad and Gandhinagar, India.
Pick the places from the catalogue that best fit what the person asks for: the kind of outing, their area, their budget per person in rupees, group size and timing.
Rules:
- Only use place ids from the catalogue. Return 3 or 4 places, best first.
- Respect the budget. For places priced per hour, split the hourly rate across the group when a group size is given.
- Stay within the person's travel distance from their area (use the lat/lng given for the area and each place).
- Each reason is one friendly sentence (under 25 words) that says why it fits: price, distance, vibe or timing. Use ₹ for money.
- The summary is one short sentence restating what you understood.

Catalogue (JSON):
${JSON.stringify(catalogue())}`;

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          place_id: { type: "string", enum: catalogue().map((p) => p.id) },
          reason: { type: "string" },
        },
        required: ["place_id", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "suggestions"],
  additionalProperties: false,
};

function readQuery(body: unknown): AiQuery | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const prompt = typeof b.prompt === "string" ? b.prompt.slice(0, 500) : "";
  const location = typeof b.location === "string" && b.location ? b.location.slice(0, 80) : "Ahmedabad, Ahmedabad";
  const budget = typeof b.budget === "number" && b.budget > 0 ? Math.min(b.budget, 10000) : 500;
  const distance = typeof b.distance === "number" && b.distance > 0 ? Math.min(b.distance, 60) : 10;
  const categories = Array.isArray(b.categories)
    ? (b.categories.filter((c) => CATEGORIES.includes(c as Category)) as Category[])
    : [];
  return { prompt, location, budget, distance, categories };
}

async function askClaude(q: AiQuery): Promise<AiResult | null> {
  const client = new Anthropic();
  const u = understand(q);
  const area = u.area;
  const user = [
    `Request: ${q.prompt || "(no text, use the filters)"}`,
    `Heading out from: ${area}`,
    `Budget per person: ₹${u.budget}`,
    `Will travel up to: ${u.distance} km`,
    q.categories.length ? `Categories they ticked: ${q.categories.join(", ")}` : "",
    u.people ? `Group size: ${u.people}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;

  const parsed = JSON.parse(text.text) as { summary: string; suggestions: { place_id: string; reason: string }[] };
  const seen = new Set<string>();
  const suggestions = parsed.suggestions
    .filter((s) => {
      const ok = !!getPlace(s.place_id) && !seen.has(s.place_id);
      seen.add(s.place_id);
      return ok;
    })
    .slice(0, 4)
    .map((s) => {
      const place = getPlace(s.place_id)!;
      return { placeId: place.id, reason: s.reason, match: fit(place, u), km: kmFrom(area, place) };
    });
  if (suggestions.length === 0) return null;
  return {
    summary: parsed.summary || `Here's what fits ${describe(u)}.`,
    // Shown closest first, farthest last.
    suggestions: byDistance(suggestions),
    understood: u,
    source: "claude",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON" }, { status: 400 });
  }
  const q = readQuery(body);
  if (!q) return Response.json({ error: "Send the filters as JSON" }, { status: 400 });

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await askClaude(q);
      if (result) return Response.json(result);
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) console.error("Planzy Scout: invalid ANTHROPIC_API_KEY");
      else if (error instanceof Anthropic.RateLimitError) console.error("Planzy Scout: rate limited, using built-in engine");
      else if (error instanceof Anthropic.APIError) console.error(`Planzy Scout: API error ${error.status}`, error.message);
      else console.error("Planzy Scout: falling back to built-in engine", error);
    }
  }
  return Response.json(suggestLocally(q));
}
