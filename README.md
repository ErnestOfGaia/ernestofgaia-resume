# eog-library — resume.ernestofgaia.xyz

Interactive resume / portfolio site. Home of the **Librarian** agent. Soft-launched to friends on 2026-04-18.

> **Master DNA reference:** [`Agent Brief - Master DNA.md`](../../Ideas%20%26%20Projects/Projects%20Management/Development%20Sprint%20Projects/Spring%20Sprint/Spring%20SprintTesting/Agent%20Brief%20-%20Master%20DNA.md) — the canonical description of every agent in the EoG ecosystem, including the Librarian.
> **Voice reference:** [`Voice & Brand DNA.md`](../../Ideas%20%26%20Projects/Projects%20Management/Marketing%20Projects/AI%20Coaching%20%26%20Tutoring%20copy/Voice%20%26%20Brand%20DNA.md)

---

## What's Here (Architecture at a Glance)

- **Stack:** Next.js (App Router) + TypeScript + `@anthropic-ai/sdk`. **Not Mastra** — this agent calls the Claude API directly.
- **Model:** `claude-opus-4-6`, `max_tokens: 1024`
- **Resume source:** Hardcoded TypeScript object at [`lib/resume.ts`](lib/resume.ts) — not RAG, not Obsidian-sourced (yet).
- **Agent endpoint:** [`app/api/agent/route.ts`](app/api/agent/route.ts) — receives `{ tab }` or `{ message }`, returns `{ content }` as markdown.
- **Question logging:** [`app/api/log-question/route.ts`](app/api/log-question/route.ts) writes to `lib/question-log.json`. Viewable in the "Questions" UI tab.
- **Chat UI:** [`components/LibrarianChatPanel.tsx`](components/LibrarianChatPanel.tsx) (slide-out) + [`components/ActiveView.tsx`](components/ActiveView.tsx) (split-pane with tabs).
- **Cross-site handoff:** "🌍 Travel to ernestofgaia.xyz" button opens the main coaching site in a new tab.

## Environment

- `ANTHROPIC_API_KEY` — required. Missing → UI falls back to static resume from `lib/resume.ts`.
- `NEXT_PUBLIC_SHOW_QUESTIONS_TAB` — optional. Set to `"true"` to render the "Questions" tab in the UI. Default: hidden.
- `SHOW_QUESTIONS_LOG` — optional, server-side only. Set to `"true"` to enable the `GET /api/log-question` endpoint. Default: returns 404.

> Both Questions gates default to off so the endpoint + tab stay invisible on the public site. POST logging still runs regardless.

## Known Gaps / Roadmap (see Master DNA for full list)

- ⏳ Voice I/O, bilingual, animation → Phase 2
- ⏳ Migrate `lib/resume.ts` → Obsidian vault import
- ⏳ Convert to Mastra agent + share RAG layer with Recruiter
- ⏳ Student-centered lead qualification follow-ups

## Getting Started

```bash
npm run dev
# → http://localhost:3000
```

Also see `AGENTS.md` (Next.js version warning) and `CLAUDE.md`.

---

*Next.js boilerplate below preserved for framework reference.*

---

## Next.js Quickstart (template)

First, run the development server:

```bash
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Edit `app/page.tsx` — the page auto-updates.

Uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) with Geist.

### Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Deploy on Vercel

[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) — easiest deploy path.
