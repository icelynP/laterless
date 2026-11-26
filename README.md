# Laterless

**Stop saving for later. Start doing.**

This upgrade keeps the existing Laterless interface and adds source-first content understanding and structured action plans.

## Run locally

Requires Node.js 18.17+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Required AI setup

Set `OPENAI_API_KEY` on the server. `OPENAI_MODEL` and `OPENAI_VISION_MODEL` default to `gpt-4o-mini`. The key is used only by backend routes and is never exposed to browser code.

Without the key, upload analysis and plan generation return a clear setup error; Laterless does not substitute fake or generic tasks.

## Content processing implemented

- **YouTube links:** attempts to retrieve the complete available caption track (prefers English); transcript is the content basis for plans. If captions are unavailable, the item is marked limited and plan generation is blocked until the user uploads source content.
- **Articles/tutorials:** fetches accessible public HTML and extracts readable article/main/body text, plus title and description. Sites that block extraction or redirect are reported rather than treated as understood.
- **Images:** supports multiple JPG, PNG, WEBP or GIF uploads and analyzes them with a vision-capable model, including visible text and uncertain details. Max 12 MB per file.
- **Transcripts:** accepts TXT, VTT, SRT and Markdown uploads and uses the supplied text as the source.
- **Video files:** supported through an optional authorized video-analysis service configured by `VIDEO_ANALYSIS_API_URL` (and optional `VIDEO_ANALYSIS_API_KEY`). The service must accept multipart `file` and return JSON with `transcript` or `contentText`; it may also return `title`, `summary`, `durationMinutes`, and `framesAnalyzed`. If not configured, the app explicitly asks for a transcript rather than pretending to analyze the video.

### Video integration contract

Configure a provider you are authorized to use. It should return a JSON object such as:

```json
{
  "title": "Project tutorial",
  "transcript": "Complete available transcript...",
  "summary": "...",
  "durationMinutes": 18,
  "framesAnalyzed": true
}
```

`framesAnalyzed: true` should only be returned by the provider when it actually analyzed representative frames. Laterless does not claim frame analysis otherwise.

## Source-grounded action generation

- No plans are generated from metadata alone. At least 100 characters of actual extracted/uploaded source content are required.
- The backend requests structured JSON and validates it with Zod before returning it.
- Tasks include category, order, time estimate, optional/essential flag and source detail. Plans include source understanding, materials, uncertainty notes and total duration.
- The model is explicitly instructed not to invent measurements, ingredients, tools, temperatures or steps.
- Malformed or empty output is rejected with an actionable error.
- Quick, Step by step and Long term modes use the same source content and different planning scopes.

## Checklist and persistence

The existing checklist remains the primary action interface. It supports checking/unchecking, editing, adding, deleting, pausing, resuming and restarting tasks. Progress and the source evidence are saved in local browser storage across refreshes on the same browser/device. Export your data from Settings.

## Important limitations

- YouTube caption availability depends on the video, region, age/access restrictions and platform behavior. A successful caption retrieval is labeled as transcript-based understanding, not as watching the video.
- Selected-frame video analysis requires a separately configured authorized provider; no provider is bundled or falsely simulated.
- Instagram, Pinterest and other social platforms may block extraction or require authorized APIs. Upload the actual image/transcript where permitted.
- Local browser storage is not cross-device cloud sync.
- This build was not tested against six live external content examples because no test URLs/files or API credentials were supplied. Verify with real sources after configuring credentials.
- Public URL fetching needs production-grade egress controls and DNS-rebinding protection before broad public deployment.

## Build

```bash
npm run build
```


## Configure the AI API

Follow [API_SETUP.md](./API_SETUP.md) to add your server-side OpenAI API key, verify it with `/api/health`, and deploy safely. Never commit `.env.local` or expose the key in frontend code.
