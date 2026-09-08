# Scope of evaluation

## Model eval
Measure the general language understanding of the fundational models.

- MMLU - multiple choice questions covering math, philosophy, medicine
- HumanEval - code generation


## LLM system eval
Eval how well the entire application including LLM performs (meeting biz req)
Testing datasets can be manuallt created, synthesized, or curated from the application
ie real world data

When we eval LLm based applications we want to eval whole system
Input user query -> [LLM, prompt, memory, tools, data sources] -> output response
For example Agents, RAG systems

## vs traditional software testing
Unlike trad software where it is deterministic and we can use things like unit tests. LLMs are non deterministic. As output can vary even with same input.
LLM testing should focus on app ability to respond to users specific tasks. We examine the output quality (relevance, coherence).

## What to eval
- hallucinations
- retrival relevance
- QA on retrival data
- Toxicity
- Summarization performance
- Code writing corectness and readability

## Extra level of complexity: testing agents
as agents use resoning to pick tools, they are more complex for testing

### 3 parts of agents
- Resoning: powered by AI (LLMs)
- Routing: interpreting request and determining the correct tool
- action: execution code/tools

## example agent: trip agent evals
- figure out which tool to call (did agent pick the right tool?)
- search api (did it call correct function with correct params?)
- use context (is it using your context?)
- construct a response (does the response have correct tone?)
- overall correctness (is the response correct?)


What could go wrong?:
- calling wront tool
- construct search incorrectly
- it can omit the context or use it incorrectly
- have a snarky tone
- give a wrong response

It is paramount to not only eval the output but all of these phases. Slight change in the context may have big consequences. And we should maintain set of representative prompts

Other things to keep in mind vs software testing
- software is deterministics, LLM agents are not
- un it tests are deterministic, agents relay on multiple paths
- integration tests rely on existing codebase and documentation, improving agents rely on data

## Tools used to evaluate agents
With eval on LLMs we ofter require a real data.

Some of the tools:
- trace instrumentation (what is happening with agent under the hood)
- eval runner (LLM as a judge)
- datasets (used to re-run experiments)
HUMAN feedback - capture human annotation in production
- playground on data - iterating on data
