# agents

Agent orchestration and decision modules.

Recommended initial files:

- `../types/agent.ts`: shared `AgentContext`, `AgentResult`, and `Agent` interface.
- `AgentOrchestrator.ts`: top-level agent coordinator. It currently returns a mock result.
- `placeholderAgents.ts`: empty placeholders for planned sub-agents.
- `rhythmAgent.ts`: main rhythm scheduling agent.
- `priorityAgent.ts`: ranks tasks and events.
- `briefingAgent.ts`: builds morning/evening summaries.
- `notificationAgent.ts`: decides when and how to surface updates.
- `agentRegistry.ts`: central place to register available agents.

Planned agent chain:

- `PriorityAgent`
- `StateAgent`
- `ScheduleAgent`
- `EventAgent`
- `InteractionAgent`
- `ExplainAgent`
