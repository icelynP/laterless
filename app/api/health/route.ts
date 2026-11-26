import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reports configuration state only. Never return secrets or key fragments.
export async function GET() {
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);
  const videoConfigured = Boolean(process.env.VIDEO_ANALYSIS_API_URL);

  return NextResponse.json({
    status: openAIConfigured ? "ready" : "needs_configuration",
    services: {
      openai: openAIConfigured ? "configured" : "missing_api_key",
      videoAnalysis: videoConfigured ? "configured" : "optional_not_configured",
      articleExtraction: "available",
      youtubeCaptions: "available_when_public_captions_are_accessible",
    },
    message: openAIConfigured
      ? "Laterless AI endpoints have the required OpenAI server key."
      : "Add OPENAI_API_KEY to the server environment and restart/redeploy.",
  });
}
