# Creating custom skills

## best practises
Best name with ground verb + ing (analyzing-marketing-campaign)
Description: max 1024 chars. Should describe what it does and when to use it. Should include specific keywords that help agents identify relevant tasks.

### Body
No format restrictions.
Recomanded secionts:
- step-by-step-instructions
- input format, output format, or examples of inputs and outputs
- common edge cases

### Degrees of freedom
Skills and their descirptions can have varied levels of freedom,

#### high freedom
General text based. Allow multiple aproaches

### medium freedom
Instructions contain customizable pseudocode, code examples or patterns. Prefered pattern exists but some variant is acepptable

### Low freedom
Instructions refer to specic scripts.
A specific sequence must be fallowed

Complex workflows: break complex operations into clear, sequential steps.
If workflows become large with many steps, consider pushing them into separate files


## Optional directories
/scripts /references /assets


## How to install new skills in cloude code
/plugin -> marketplace -> anthropics/skills (github repo

## How to evaluate skills
Just ask claude code to use the skill-creator

```md
Use skill-creator to evaluate how well my skills in @../custom_skills/ have followed the best practices. Use two subagents in parallel, each subagent evaluates one.
``` 

## Writing unit tests for skills. Example
```JSON
{
    "skills":["generate-practice-questions"],
    "queries": [
        "Generate practice questions from this lecture note and save it to output.md",
        "Generate practice questions from this lecture note and save it to output.pdf"
    ],
    "files": ["test-files/notes.pdf"],
    "expected_behavior": [
        "Sucessfuly reads and extracts the input file. For pdf input, uses pdfplumber",
        "Saves the generated questions to a file named output."
    ],
    "also": ["Get human feedback", "Test with all the models you are planning to use"]
}
```
