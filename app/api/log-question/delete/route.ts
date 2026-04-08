import { promises as fs } from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "lib", "question-log.json");

export async function POST(request: Request) {
  try {
    const { timestamp } = await request.json();

    if (!timestamp) {
      return Response.json(
        { error: "Timestamp is required" },
        { status: 400 }
      );
    }

    // Read existing logs
    const fileContent = await fs.readFile(LOG_FILE, "utf-8");
    const logs = JSON.parse(fileContent);

    // Filter out the question with matching timestamp
    const filtered = logs.filter((log: any) => log.timestamp !== timestamp);

    // Check if anything was deleted
    if (filtered.length === logs.length) {
      return Response.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Write back to file
    await fs.writeFile(LOG_FILE, JSON.stringify(filtered, null, 2));

    return Response.json({
      success: true,
      message: "Question deleted",
      remaining: filtered.length,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return Response.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
