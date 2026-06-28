# 24h Assistant Project Understanding

## Core Positioning

This project is not an AI calendar or a smarter reminder tool. It is a **24-hour personal rhythm agent** that decides:

- What the user should do now.
- Whether the current plan should be rescheduled.
- Whether the user should be interrupted.
- How external events should be absorbed, delayed, summarized, or escalated.

The memorable product sentence is:

> A time scheduling agent that knows when not to disturb you.

For demo and product decisions, the strongest framing is:

- Attention Firewall
- State-Aware Scheduling
- Silent Night Mode + Morning Briefing

## Hackathon MVP Goal

The MVP should be a strong demo loop, not a complete product. The core scene must show:

1. The user has a planned day rhythm.
2. The user state changes, such as poor sleep, high pressure, or fatigue.
3. An external urgent event arrives, such as a GitHub P1 issue.
4. The agent decides whether to interrupt, reschedule, or delay.
5. The UI shows the new schedule, notification routing, and concise explanations.

The judge-facing impact should be:

> When user state worsens and an urgent external task appears, the agent does not blindly notify. It evaluates interruption level, reschedules intelligently, and explains why.

## Must-Have MVP Features

1. **Today Rhythm Home**
   - Show a full-day timeline.
   - Segment the day into focus, micro-slot, rest, and sleep periods.
   - Display tasks inside the appropriate rhythm blocks.

2. **State-Aware Rescheduling**
   - Provide simulated inputs such as poor sleep, high pressure, fatigue, and urgent task insertion.
   - Generate a new plan when state changes.
   - Reduce task intensity when the user state is poor.
   - Insert recovery windows or move lower-priority tasks.

3. **Attention Firewall**
   - Classify notifications/events into:
     - Interrupt now
     - Remind later
     - Morning brief
     - Silent archive
   - The product value is disturbance management, not notification volume.

4. **Explainable Schedule**
   - Every reschedule should include short reasons.
   - Example: "Sleep quality was low, so morning deep-work load was reduced by 30%."
   - Explanations should be visible enough for trust, but not verbose.

5. **Agent Conversation Entry**
   - Support a demo command like: "I am tired now, help me reschedule the afternoon."
   - Return a revised schedule and explanations.

6. **Morning Briefing**
   - Summarize night events.
   - Show today's adjusted plan.
   - Explain how sleep or state data affected the plan.

## What To Simulate

For the hackathon/demo version, simulate these rather than integrating real services:

- Sleep score, stress level, fatigue, emotion, recovery state.
- GitHub P1 issue or urgent external task.
- Course schedule, task list, collaboration messages.
- Notification delivery.

Real wearable integration, full account systems, live GitHub monitoring, and multi-platform push notifications are out of scope for the first demo.

## Product Mechanics

### Schedule Anchors

Immutable or protected time blocks should not be invaded by normal tasks:

- Sleep
- Classes
- Exams
- Meetings
- Exercise/recovery
- User-locked rest time
- Deadline submission windows

### Task Types

Tasks should be grouped into six rough categories:

- Deep work
- Communication
- Lightweight tasks
- Review/retrospective
- Recovery
- Optional tasks

### Autonomy Levels

Use an autonomy dial concept:

- **Auto**: low-risk adjustments, such as moving reading or grouping normal messages.
- **Ask**: medium-impact changes, such as moving important tasks.
- **Lock**: protected time that the agent cannot invade.

### Notification Authority

Events should be routed based on urgency, time period, and user state:

- Highest authority: can notify any time, but should still be rare.
- Normal authority: grouped into micro-slots, later reminders, morning/evening reports.
- Passive response: the user can ask the agent any time for the current plan or a reschedule.

## Demo Storyline

Recommended 3-minute demo:

1. Show the daily rhythm home.
2. Trigger "poor sleep last night."
3. The system reduces morning deep work and inserts a recovery window.
4. Trigger "GitHub P1 issue."
5. The agent evaluates urgency and current focus/state.
6. It offers or applies two paths:
   - Fix now with a 25-minute minimal patch.
   - Move to 14:00 and shift low-priority tasks.
7. Show the Attention Firewall:
   - Urgent event gets surfaced.
   - Normal messages are delayed.
   - Night events go to silent archive.
8. Switch to Morning Briefing:
   - Night summary.
   - Today's schedule.
   - Reason for intensity adjustment.

## Suggested UI Surfaces

- Full-day rhythm timeline.
- Current state panel with sleep, stress, fatigue, and focus level.
- Task cards with priority, type, duration, and flexibility.
- Reschedule result comparison or animation.
- Attention Firewall panel with notification categories.
- Agent explanation panel.
- Chat input for reschedule commands.
- Morning briefing view.

## Suggested Data Model

```ts
type UserState = {
  sleepScore: number;
  stressLevel: "low" | "medium" | "high";
  fatigueLevel: "low" | "medium" | "high";
  mood?: "low" | "neutral" | "good";
  focusCapacity: "low" | "normal" | "high";
};

type Task = {
  id: string;
  title: string;
  type: "deep" | "communication" | "light" | "review" | "recovery" | "optional";
  priority: "P0" | "P1" | "P2" | "P3";
  durationMinutes: number;
  deadline?: string;
  flexible: boolean;
};

type ScheduleBlock = {
  id: string;
  start: string;
  end: string;
  mode: "focus" | "micro" | "rest" | "sleep";
  locked: boolean;
  taskIds: string[];
};

type ExternalEvent = {
  id: string;
  source: "github" | "calendar" | "message" | "course" | "manual";
  title: string;
  priority: "critical" | "high" | "normal" | "low";
  receivedAt: string;
};

type AgentDecision = {
  schedule: ScheduleBlock[];
  notificationRoute: "interrupt" | "later" | "morningBrief" | "silentArchive";
  explanations: string[];
  requiresConfirmation: boolean;
};
```

## Decision Rules For The First Version

- Poor sleep reduces morning deep-work capacity.
- High pressure reduces communication-heavy tasks.
- Fatigue inserts recovery tasks and short breaks.
- Locked blocks cannot be moved.
- P1/P0 tasks can displace lower-priority flexible tasks.
- Nighttime normal events are archived into morning briefing.
- If a change affects a high-priority or locked-adjacent task, ask before applying.
- Every schedule change must include at least one human-readable reason.

## Build Priority

1. Interface completeness.
2. Reschedule loop.
3. Clear explanations.
4. Demo data polish.
5. Real integrations only after the story loop works.

## Main Risk

The biggest risk is scope creep. The first build should protect one powerful closed loop:

> State change + urgent event + intelligent reschedule + interruption control + explanation.

