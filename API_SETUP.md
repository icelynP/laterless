# Laterless API setup

Laterless already contains server-side API routes for source inspection, upload understanding,
and structured checklist generation. This guide connects those routes to your own API account.

## 1. Create an OpenAI API key

1. Sign in at https://platform.openai.com/
2. Open the API keys page: https://platform.openai.com/api-keys
3. Create a new secret key and copy it once.
4. Ensure API billing/credits and model access are enabled for that API project.

ChatGPT subscriptions and OpenAI API billing are separate. A ChatGPT plan does not automatically
provide API credits.

## 2. Configure the key locally

In the project root (the folder containing `package.json`), create a file named `.env.local`.
Copy the values from `.env.local.example` and replace the placeholder:

```env
OPENAI_API_KEY=your_real_secret_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

Do not add `NEXT_PUBLIC_` to the key name. Do not commit `.env.local` to Git or put the key
inside React components, browser code, screenshots, or public environment variables.

Restart the development server after changing environment variables:

```bash
npm install
npm run dev
```

## 3. Verify configuration

Open this endpoint on your running app:

`http://localhost:3000/api/health`

It reports whether the server can see the required key. It never returns the key itself.
A response of `needs_configuration` means the server process has not received `OPENAI_API_KEY`.

## 4. Deploying to Vercel

1. Import the project into Vercel.
2. Open Project Settings → Environment Variables.
3. Add `OPENAI_API_KEY` with the secret value. Add `OPENAI_MODEL` and `OPENAI_VISION_MODEL`
   if you want to override the defaults.
4. Apply the variables to the environments you use (Preview and Production as appropriate).
5. Redeploy after adding or changing environment variables.
6. Visit `https://YOUR-APP-DOMAIN/api/health` to verify.

Never put the key in a client-side variable or share it in a public repository.

## 5. What works with the OpenAI key

- Image understanding: uploaded JPG, PNG, WEBP and GIF images are sent to the vision-capable
  model from the backend.
- Checklist generation: source text/transcripts are sent to the model and validated against
  a structured schema before being returned.
- Article extraction: the app attempts to extract the article text from accessible public HTML.
- YouTube: the app attempts to retrieve publicly accessible captions. It does not claim to watch
  a video when only captions or metadata were obtained.

## 6. Optional video-analysis API

A generic video provider cannot be safely configured without knowing its exact API contract,
authentication method, upload limits, and permitted usage. The existing integration expects:
- `VIDEO_ANALYSIS_API_URL`
- optional `VIDEO_ANALYSIS_API_KEY`
- multipart upload field named `file`
- JSON response with `title`, `transcript` or `contentText`, optional `summary`,
  `durationMinutes`, and optional `framesAnalyzed`

Only use a provider whose terms authorize this processing. Do not invent an endpoint URL.
If you choose a provider, its documentation can be used to adapt the integration accurately.

## 7. Troubleshooting

- `AI planning is not configured`: the running server cannot see `OPENAI_API_KEY`; check the
  variable name and restart/redeploy.
- `The AI service could not generate a plan`: check API billing, key validity, model access,
  provider status, and server logs.
- Image analysis fails: check the image type and 12 MB per-file limit.
- Video link has no accessible captions: upload the transcript/captions, or configure an
  authorized video-analysis provider. Metadata-only plans are intentionally blocked.
- Article extraction fails: the website may block automated access; upload article text instead.

## Important limitations

This API setup does not create an API key or pay for API usage on your behalf. The project ZIP
contains no secret credentials. Public URL fetching should receive production-grade egress and
DNS-rebinding protections before broad public deployment. The app currently persists app data
in browser local storage; it does not provide cross-device database synchronization.
