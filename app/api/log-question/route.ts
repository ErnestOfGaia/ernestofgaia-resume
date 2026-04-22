import { promises as fs } from "fs";
import path from "path";

interface QuestionLog {
  timestamp: string;
  question: string;
  detectedSection?: "Historical" | "Skills Based" | "Passions" | null;
  detectedTopic?: string;
  responseType: "tab" | "expanded" | "custom";
  userAgent?: string;
}

const LOG_FILE = path.join(process.cwd(), "lib", "question-log.json");

async function ensureLogFile() {
  try {
    await fs.access(LOG_FILE);
  } catch {
    // File doesn't exist, create it
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.writeFile(LOG_FILE, JSON.stringify([], null, 2));
  }
}

export async function POST(request: Request) {
  try {
    const { question, detectedSection, detectedTopic, responseType } = await request.json();

    if (!question) {
      return Response.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    await ensureLogFile();

    // Read existing logs
    const fileContent = await fs.readFile(LOG_FILE, "utf-8");
    const logs: QuestionLog[] = JSON.parse(fileContent);

    // Add new log entry
    const newLog: QuestionLog = {
      timestamp: new Date().toISOString(),
      question,
      detectedSection: detectedSection || null,
      detectedTopic,
      responseType,
      userAgent: request.headers.get("user-agent") || undefined,
    };

    logs.push(newLog);

    // Write back to file
    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));

    return Response.json({
      success: true,
      message: "Question logged",
    });
  } catch (error) {
    console.error("Error logging question:", error);
    return Response.json(
      { error: "Failed to log question" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve question logs.
 *
 * Gated by SHOW_QUESTIONS_LOG env var (server-side, no NEXT_PUBLIC_ prefix).
 * When unset, returns 404 so the endpoint is invisible on the public site.
 * Set SHOW_QUESTIONS_LOG=true locally or in a private deploy to enable.
 */
export async function GET(request: Request) {
  if (process.env.SHOW_QUESTIONS_LOG !== "true") {
    return new Response("Not Found", { status: 404 });
  }

  try {
    await ensureLogFile();

    const fileContent = await fs.readFile(LOG_FILE, "utf-8");
    const logs: QuestionLog[] = JSON.parse(fileContent);

    // Optional: filter by section or topic
    const url = new URL(request.url);
    const section = url.searchParams.get("section");
    const topic = url.searchParams.get("topic");

    let filtered = logs;

    if (section) {
      filtered = filtered.filter((log) => log.detectedSection === section);
    }

    if (topic) {
      filtered = filtered.filter((log) =>
        log.detectedTopic?.toLowerCase().includes(topic.toLowerCase())
      );
    }

    return Response.json({
      total: logs.length,
      filtered: filtered.length,
      logs: filtered,
    });
  } catch (error) {
    console.error("Error reading question logs:", error);
    return Response.json(
      { error: "Failed to read question logs" },
      { status: 500 }
    );
  }
}
