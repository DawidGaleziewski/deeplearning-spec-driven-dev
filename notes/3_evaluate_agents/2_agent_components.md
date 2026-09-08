# Main components

## Ai router
Main planner of the agent. Spine.
Decides which skill or function to call to answer the users question.
Can take a form of: LLM, NLP classifier, or even rule based code.
Some agents distribure logic through the agent instead of havin a single router unit.

The simpler the router is. The simpler the router. The better the performance but the more we scope the capability.
LLM with function calls has a broad functionallity, but is less realiable then code based router.

Some frameworks instead of having one router will distribute the logic. Like langraph or openai swarm.


## Skills
Individual logic box and capabilities agents have.
Contact outside world, contact API. and accomplish diffrent taks.
Each agent will have one or more skills.

Skills are made up of individual steps, LLM calls, application code, API code
i.E a RAG sill. Embeded input query -> Vector DB lookup -> LLM call w retrived context


Once skill is complete it will have output and return to output to decide what to do next

## Memory and state
Shared state that can be accessed by each component in the agent. used to store:
- retrived context
- configuration variables
- previous agent execution steps (like the table of all previous MSGs [{role: "system", content: "You are a assitant"}]





