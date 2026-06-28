# 24h-agent

Pure frontend hackathon MVP for a 24-hour personal rhythm agent.

## Tech Stack

- Vite
- React
- TypeScript
- Pure frontend demo
- Simulated Agent logic and demo data

## Initialization Commands

```bash
npm create vite@latest 24h-agent -- --template react-ts
cd 24h-agent
npm install
npm run dev
```

## What Each Step Does

1. `npm create vite@latest 24h-agent -- --template react-ts`
   - Creates a new Vite project named `24h-agent`.
   - Uses the React + TypeScript template.
   - Provides fast local development with hot module replacement.

2. `cd 24h-agent`
   - Enters the generated project directory.

3. `npm install`
   - Installs React, Vite, TypeScript, and development dependencies.
   - Generates `node_modules` and `package-lock.json`.

4. `npm run dev`
   - Starts the local Vite development server.
   - Use this for hackathon iteration and live preview.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `dev`: start local development server.
- `build`: type-check and build production assets.
- `lint`: run Oxlint.
- `preview`: preview the production build locally.

## Project Structure

```text
24h-agent/
  public/
  src/
    agents/
      rhythmAgent.ts
    app/
      App.tsx
    data/
      demoData.ts
    features/
      briefing/
      firewall/
      reschedule/
      rhythm/
    shared/
      components/
      lib/
    styles/
    types/
      domain.ts
    App.tsx
    index.css
    main.tsx
  package.json
  vite.config.ts
```

## Architecture Notes

- `src/app`: app composition and top-level page shell.
- `src/agents`: frontend Agent decision logic. Later this can call real APIs or multiple Agents.
- `src/features`: feature modules. Each major product area owns its components.
- `src/data`: mock data for fast demo iteration.
- `src/types`: shared domain types for tasks, schedule blocks, events, user state, and Agent decisions.
- `src/shared`: reusable utilities and UI pieces.

## MVP Scope

The current scaffold focuses on:

- Today rhythm timeline.
- State simulator for poor sleep and high stress.
- P1 GitHub event trigger.
- Rule-based rescheduling Agent.
- Attention Firewall routing.
- Morning briefing summary.

The first demo intentionally avoids backend, real wearable data, real GitHub webhooks, and system notifications.

