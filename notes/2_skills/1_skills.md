# what are they?
Capabilities extanding agents capabilities and knowledge.

Skills are now a opened standard. So you can build them once and deploy to multiple agents.

# skills structure contains
written in .md. Name, description, main instructions.
Skills always live in the agent context. But agent will load the rest of instrcutions only when needed.


# when to use skill?

When there is repetable workflow. Something we do often by ourselves.
But also when we don't want to this data to pollute the context. As skills are loaded per need basis.


# structure of a skill
We put skills in folders. Each has to have to be named SKILL.md.


## Yaml with name and description,. This is required for skill tow rok

This is actually use by UI and model to determine when to use it
---
name: analyzing-campaign
description: Analuze the....
---

## Name & description


Very important to name good for agent to pick right skill

```md
# Marketing campaign analysis

Automated analysis of multi-channel marketing campaign
```

## Input requirments

```md
**date**: campaign date
**campaign_name**: campaign identifier
**spend**: Marketing spend in dollars
...
```

## Data Quality Check

```md
1. Check for missing values
2. Verify negative values
```

Question: wouldnt it be better to use something like pydantic or typescript syntax?
Answer yes this can be done
```
skills/
└── campaign-analytics/
    ├── SKILL.md                 # Linked documentation & reasoning
    ├── schemas/
    │   └── campaign.json        # Shared JSON Schema file
    └── src/
        ├── schema.ts            # Generated Zod / TS types
        └── validate.ts          # Executable validation code
```

## Instructions

```md
## Funnel analysis
Calculate per channel:
...

## Efficiency analysis
Calculate per channel:
...
```

## Output format
How we want the data to be outputed

```md
Present resaults in table
Channel, CTR Actual...
```

## Other actions and condition (skill references)

We can reference other promt with extra instructions

```md
## Budget reallocation
If user asks about budget rellocation read `references/budget.md`
..
```




# General folder structure for skills

We want one folder with name of the skill like "analyzing-marketing-campaign". Inside SKILL.md holds main skill and in folder /references we have things we can point to with that skill
