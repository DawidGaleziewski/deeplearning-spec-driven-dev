from tqdm import tqdm

from example_agent.agent import start_main_span

agent_questions = [
    "What was the most popular product SKU?",
    "What was the total revenue across all stores?",
    "Which store had the highest sales volume?",
    "Create a bar chart showing total sales by store",
    "What percentage of items were sold on promotion?",
    "What was the average transaction value?"
]

#  This will run our example questions we will later download from pheoenix for evaluation
for question in tqdm(agent_questions):
    try:
        ret = start_main_span([{"role": "user", "content": question}])
    except Exception as e:
        print(f"Error processing question: {question} - {e}")
        print(e)
        continue