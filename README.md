# Mimo Max AI Assistant

A polished zero-dependency web demo prepared for a Mimo Max 1.6B API access request. The goal is to show reviewers a real product direction instead of an empty API test: a safe assistant UI, server-side API wrapper, clear Indonesian-language use cases, and a practical rollout plan.

## Why this project can help an API request

- **Clear use case:** Indonesian productivity assistant for founders, creators, and UMKM teams.
- **Real integration path:** `/api/chat` keeps the API key server-side and calls an OpenAI-compatible chat completion endpoint.
- **Responsible design:** input length limit, system guidance, no client-side secrets, and a rate-limit-ready API boundary.
- **Review-friendly docs:** this repo includes an access proposal, roadmap, and setup instructions.
- **Demo mode:** the app runs even before credentials are approved, so reviewers can inspect the workflow.

## Features

- Polished landing page with a credible product narrative.
- Interactive chat panel connected to a server API route.
- Server-side Mimo API wrapper in `server.js`.
- Environment-driven configuration for API key, base URL, and model name.
- Built-in proposal section and detailed docs for access-review context.

## Tech stack

- Node.js 16+
- Plain HTML, CSS, and JavaScript
- No install-time dependencies

## Getting started

```bash
npm run dev
```

Open `http://localhost:3000`.

The app works in demo mode until real API credentials are added.

## Configure Mimo API access

Create a local environment file from `.env.example`:

```bash
cp .env.example .env.local
```

Then update:

```env
MIMO_API_KEY=your_real_key
MIMO_BASE_URL=https://your-approved-mimo-api-base-url/v1
MIMO_MODEL=mimo-max-1.6b
```

The API wrapper currently expects an OpenAI-compatible route:

```text
POST {MIMO_BASE_URL}/chat/completions
```

This project does not automatically load `.env.local` because it has no dependencies. You can either export the variables in your shell, use a process manager that loads env files, or add `dotenv` later if desired.

If Mimo provides a different official endpoint or response shape, update `server.js`.

## API access request summary

We are requesting access to Mimo Max 1.6B to build an Indonesian AI assistant that helps small teams:

- summarize long notes and articles into action items;
- draft customer support replies and product copy;
- turn rough ideas into specs, acceptance criteria, and launch checklists;
- evaluate prompt quality, latency, and model reliability for local-language workflows.

## Responsible usage plan

- Keep API keys only in server-side environment variables.
- Add rate limiting before any public beta.
- Log only operational metadata, not private prompt content.
- Provide user feedback controls for bad or unsafe answers.
- Start with a limited beta before scaling usage.

## Roadmap

- **Week 1:** connect approved Mimo credentials and verify endpoint behavior.
- **Week 2:** build an Indonesian prompt evaluation set.
- **Week 3:** add chat history, saved templates, and feedback capture.
- **Week 4:** launch a small beta for creators and UMKM operators.

## Repository structure

```text
server.js                 Static server and server-side Mimo API wrapper
public/
  index.html              Landing page, proposal section, and chat UI
  styles.css              Visual design
  app.js                  Browser chat behavior
docs/
  API_ACCESS_PROPOSAL.md  Detailed proposal for API review
  APPLICATION_MESSAGE.md  Copy-paste message for the access form
```

## Notes for reviewers

This repository is intentionally small and focused. It demonstrates product intent, secure API handling, and realistic next steps while keeping the code easy to inspect.
