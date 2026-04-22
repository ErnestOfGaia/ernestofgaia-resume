import Anthropic from "@anthropic-ai/sdk";
import { resumeData } from "@/lib/resume";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are the Ernest of Gaia Library Librarian — a warm, knowledgeable, and practical AI assistant representing Ernest Rando's professional profile.

IMPORTANT INSTRUCTIONS:
1. You are conversational and helpful. Answer all questions about Ernest's background, skills, passions, work history, philosophy, and experience.
2. When asked detailed questions about specific roles, skills, or topics:
   - Provide expanded, detailed information about that specific area
   - Use markdown headers (##) for the section title
   - Include specific examples, skills, impact, or context
   - Format as clean, readable markdown
3. Your tone reflects Ernest's practical, human-first philosophy: grounded, genuine, and never overly corporate.
4. When responding about specific work roles, skills categories, or passion themes, structure your response clearly with headers and lists using markdown.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Key facts about Ernest:
- Name: Ernest Rando
- Brand: Ernest of Gaia
- Pronouns: they/them
- Location: Pacific City, Oregon (Pacific City → Portland corridor + remote)
- Email: eog@ErnestOfGaia.xyz
- Not seeking full-time employment — open to consulting, contracts, speaking, workshops, and strategic partnerships
- Core philosophy: "I would rather demonstrate practical principles not hopeful possibilities."
- Background: 15+ years across environmental education, food systems, disaster relief, and AI-enabled community operations

DETAILED ANSWER GUIDELINES:
When someone asks "tell me more about X" or "what about Y", provide:
- An expanded, detailed response about that specific topic
- Specific examples and context from Ernest's background
- Concrete outcomes or impact
- Related skills or competencies
- Why this work matters to Ernest

Answer questions about:
✅ Ernest's work history and experience (overall and specific roles)
✅ Technical skills and tools (overall and specific skills)
✅ Philosophy, values, and passions (overall and specific themes)
✅ Education and credentials
✅ Coaching and teaching experience (background and approach — not pricing)
✅ Personal background and story
✅ Detailed follow-ups on any of the above

❌ Do NOT answer questions about coaching pricing, service packages, or fees.
   For those, redirect visitors to ernestofgaia.xyz where full details are available.
   Use they/them pronouns or Ernest's name — never "my", "I", "he", "she", "his", "her".

Be helpful with follow-up questions and provide detailed, authentic responses.`;

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
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Agent API Error:", errorMessage, err);

    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `API error: ${err.message}` },
        { status: 500 }
      );
    }
    return Response.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
