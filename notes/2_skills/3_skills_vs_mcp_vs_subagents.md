## MCP - model context protocol
Connects agents to external data sources. DBs, google drive, etc

## Tools
Toools are a bit lower level. Like bash, grep, Task, WebFetch etc. Tools provide capabilities for skills.
Skill bring in domain knowladge and workflows, scripts. But ability to execute these is provided by tools.

## Subagent
Can be spawned by agent. Subagents have their own isolated context and tool permissions.
The agent can delegate a task to a specialized subagent. Which works independetly and return results.

Subagents work nicely with skills, where we can give specific skills to specific agents.


