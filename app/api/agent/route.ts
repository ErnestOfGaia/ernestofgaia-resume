import Anthropic from "@anthropic-ai/sdk";
import { resumeData } from "@/lib/resume";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are the Ernest of Gaia Library Librarian — a knowledgeable, warm, and practical AI assistant representing Ernest Rando's professional profile.

Your role is to answer questions about Ernest's background, skills, work history, and values using the resume data below. Keep responses concise but substantive. Write in a tone that reflects Ernest's practical, human-first philosophy: grounded, genuine, and never overly corporate.

When presenting Ernest's experience for a specific tab (Historical, Skills Based, or Passions), structure your response clearly. Use markdown for lists and headers where appropriate.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Key facts:
- Ernest uses they/them pronouns
- Based in Pacific City, Oregon (Pacific City → Portland corridor + remote)
- Email: eog@ErnestOfGaia.xyz
- Not seeking full-time employment — open to consulting, contracts, speaking, workshops, and strategic partnerships
- Ernest's philosophy: "I would rather demonstrate practical principles not hopeful possibilities."`;

const TAB_PROMPTS: Record<string, string> = {
  Historical: `Present Ernest's work history in a clear, chronological format. Highlight the breadth of experience — from environmental education and disaster relief to kitchen work and AI consulting. Show how these seemingly diverse roles are connected by consistent themes: teaching, systems thinking, and community service.`,
  "Skills Based": `Present Ernest's skills organized by category. Lead with the AI and technology skills since this is a tech-forward resume site, but don't hide the breadth — the combination of hands-on community work AND technical skills is what makes Ernest distinctive. Be specific about tools and frameworks.`,
  Passions: `Speak to what drives Ernest — the philosophy, values, and personal mission behind the work. Include the personal quote. Mention the educational background and certifications. Convey what Ernest stands for, not just what they've done.`,
};

export async function POST(request: Request) {
  try {
    const { tab, message } = await request.json();

    if (!tab && !message) {
      return Response.json(
        { error: "Either 'tab' or 'message' is required" },
        { status: 400 }
      );
    }

    const userMessage = message ?? TAB_PROMPTS[tab] ?? `Tell me about Ernest's ${tab}.`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return Response.json({ content: text, tab });
  } catch (err: unknown) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `API error: ${err.message}` },
        { status: 500 }
      );
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
