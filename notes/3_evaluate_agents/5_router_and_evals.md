# evals

## Code based evals
running code to compare outputs, run calculations on outputs, etc.

### Regex match
ie response only contains numbers

### JSON parseable

### Contains keywords
I.E Chatbots use

### direct match

### Cosine similarity/cosine distance 

## LLM as a judge eval
Comparing input and output by separate LLM. Using prompt after that to commpare both

Example:
retrival span -> retrival span[Input : [user query, documents], [output] ] -> pheoenix library[Eval template, model params, eval llm]

### Important caviets on LLM as a judge
- Only best LLMs can rival human judgment.
- Still it is not 100% accurate.
- Tuning the prompt can he;p close the gap
- use discrete classification labels like "correct" and "incorrect" and not %. LLMs suck at putting % on accurecy.

## Human annotations
use human labelers or user feedback to evaluate your application outputs. LLM wll evan, put access ton specific response.
We can use pheonix to attach annotationts and feedback to annotation queues that can be setup in pheonix

# Chosing what to evaluate
## Router
- function callin g choice - did the router choose the  right function to call?
- parameter extraction - did the router extract the right function parameters from the question?

### How to evaluate router
Best way is to use LLM as a judge.

## Skills
Skills are eaither software applications, llm calls, or api calls. So we can use same techniques we would use to eval standarsd applications

We can eval skills on:
- relevance
- hallucination
- q/a corerectness
- generated code readability
- summarization
- regex
- json parseable

### Standard LLM evals

### Code base Evals

### LLM as a judge


