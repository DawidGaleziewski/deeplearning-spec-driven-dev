Skills are a lightweight, open format for extendin g AI agent capabilities.
Skills have to be placed in a folder named as that skill with SKILL.md in root. But they also can have references or even scripts/ with files like .py scripts.

Skills can also include icons, images etc.

## Skills then vs now
We used to have specialized agents like Finance or coding agent. However now we can have general purpose agents. That have skills encapplulationg things like context and domain expertiese.

Skills can also provide repetable worflows.

Skill can extand agets with new capabilities.

## Open standard

Skills are oipen standard and can be used by multiple types of agents

## Composable skills
We can compose skills to build complex workflows
BigQuery skills (proviide marketing schema) -> marketing campaign analysis (analyze marketing data) -> powerpoint skills (create a slide deck)


## Idea of progressive discolsure

The idea is to only load data necessery. Like name and description of the skill. And load more info if needed to save the context.
In general we want to avoid polutiong context, to save the tokens, avoid halucinations etc.

Next if needed instructions of skill will be loaded.

Lastly extra scripts and referances are loaded. Only when needed
