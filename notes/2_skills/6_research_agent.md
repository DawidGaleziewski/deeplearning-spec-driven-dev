# Research agent with claude sdk - plan

## Main agent
Orchiestrates rest agents. Delegates tasks.
Has a learning a tool skil. That allows it to use 3 diffrent subagents to synthesize all data and store it in learning-{toolname} folder.


### Docs Researcher subagent

### Repo analyzer subagent

### Web researcher subagent


## MCP for notion server
used to store our data

# Installing depts
```python
uv init
uv add claude-agent-sdk python-dotenv asynctio

touch agent.py
```

## Agent configuration

### mpc and tools
we will define mpc servers like notion and their tokens. Ie notion mcp and its token.

### Importing agents
Import agent definitions from .md files in agent.py.

### Tools
similar to langchain we need to give what agent can use. Tools like Write, Grep and Glob, Bash, WebFeth also Skills in order to allow agents to use skills.

We also want to point to where skills are located by setting_sources



